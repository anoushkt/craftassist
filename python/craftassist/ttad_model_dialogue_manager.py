"""
Copyright (c) Facebook, Inc. and its affiliates.
"""
import ipdb
import json
import logging
import os
import re
import spacy
from typing import Tuple, Dict, Optional

import sentry_sdk

import preprocess
from dialogue_manager import DialogueManager
from dialogue_objects import (
    BotCapabilities,
    BotGreet,
    BotVisionDebug,
    DialogueObject,
    GetMemoryHandler,
    Interpreter,
    PutMemoryHandler,
    Say,
    coref_resolve,
    process_spans,
)

# For previous model
from ttad.ttad_model.ttad_model_wrapper import ActionDictBuilder

from ttad.ttad_transformer_model.query_model import TTADBertModel
from util import hash_user

sp = spacy.load("en_core_web_sm")


class TtadModelDialogueManager(DialogueManager):
    def __init__(
        self,
        agent,
        ttad_prev_model_path,
        ttad_model_dir,
        ttad_bert_data_dir,
        ttad_embeddings_path,
        ttad_grammar_path,
        no_ground_truth_actions=False,
    ):
        super(TtadModelDialogueManager, self).__init__(agent, None)
        self.ttad_prev_model = None
        # the following are still scripted and are handled directly from here
        self.botCapabilityQuery = [
            "what can you do",
            "what else can you do",
            "what do you know",
            "tell me what you can do",
            "what things can you do",
            "what are your capabilities",
            "show me what you can do",
            "what are you capable of",
            "help me",
            "help",
            "do something",
        ]
        self.botGreetings = ["hi", "hello", "hey"]
        logging.info("using ttad_prev_model_path={}".format(ttad_prev_model_path))
        logging.info("using ttad_model_dir={}".format(ttad_model_dir))

        # Instantiate the previous TTAD model
        if ttad_prev_model_path:
            self.ttad_prev_model = ActionDictBuilder(
                ttad_prev_model_path,
                embeddings_path=ttad_embeddings_path,
                action_tree_path=ttad_grammar_path,
            )

        # Instantiate the current TTAD model
        if ttad_model_dir:
            self.ttad_model = TTADBertModel(model_dir=ttad_model_dir, data_dir=ttad_bert_data_dir)
        self.debug_mode = False

        # ground_truth_data is the ground truth action dict from templated
        # generations and will be queried first if checked in.
        self.ground_truth_actions = {}
        if not no_ground_truth_actions:
            ground_truth_file = os.path.join(
                os.path.dirname(os.path.realpath(__file__)), "ground_truth_data.txt"
            )
            if os.path.isfile(ground_truth_file):
                with open(ground_truth_file) as f:
                    for line in f.readlines():
                        text, action_dict = line.strip().split("\t")
                        add = json.loads(action_dict)
                        self.ground_truth_actions[text] = add

        self.dialogue_object_parameters = {
            "agent": self.agent,
            "memory": self.agent.memory,
            "dialogue_stack": self.dialogue_stack,
        }

    def run_model(self, chat: Tuple[str, str]) -> Optional[DialogueObject]:
        """Process a chat and maybe modify the dialogue stack"""

        if chat[1] == "ipdb":
            ipdb.set_trace()

        if len(self.dialogue_stack) > 0 and self.dialogue_stack[-1].awaiting_response:
            return None

        # chat is a single line command
        speaker, chatstr = chat
        preprocessed_chatstrs = preprocess.preprocess_chat(chatstr)

        # Push appropriate DialogueObjects to stack if incomign chat
        # is one of the scripted ones
        if any([chat in self.botCapabilityQuery for chat in preprocessed_chatstrs]):
            return BotCapabilities(**self.dialogue_object_parameters)
        if any([chat in self.botGreetings for chat in preprocessed_chatstrs]):
            return BotGreet(**self.dialogue_object_parameters)
        if any(["debug_remove" in chat for chat in preprocessed_chatstrs]):
            return BotVisionDebug(**self.dialogue_object_parameters)

        # don't use preprocess for ttad, done in the model code
        action_dict = self.ttad(s=chatstr, model=self.ttad_model)
        return self.handle_action_dict(speaker, action_dict, preprocessed_chatstrs[0])

    def handle_action_dict(self, speaker: str, d: Dict, chatstr: str) -> Optional[DialogueObject]:
        """Return the appropriate DialogueObject to handle an action dict "d"

        "d" should have spans resolved by corefs not yet resolved to a specific
        MemoryObject
        """
        coref_resolve(self.agent.memory, d, chatstr)
        logging.info('ttad post-coref "{}" -> {}'.format(hash_user(speaker), d))

        if d["dialogue_type"] == "NOOP":
            return Say("I don't know how to answer that.", **self.dialogue_object_parameters)
        elif d["dialogue_type"] == "HUMAN_GIVE_COMMAND":
            return Interpreter(speaker, d, **self.dialogue_object_parameters)
        elif d["dialogue_type"] == "PUT_MEMORY":
            return PutMemoryHandler(speaker, d, **self.dialogue_object_parameters)
        elif d["dialogue_type"] == "GET_MEMORY":
            logging.info("this model out: %r" % (d))
            logging.info("querying previous model now")
            if self.ttad_prev_model:
                prev_model_d = self.ttad(s=chatstr, model=self.ttad_prev_model, chat_as_list=True)
                logging.info("prev model out: %r" % (prev_model_d))
                if (
                    prev_model_d["dialogue_type"] != "GET_MEMORY"
                ):  # this happens sometimes when new model sayas its an Answer action but previous says noop
                    return Say(
                        "I don't know how to answer that.", **self.dialogue_object_parameters
                    )
                return GetMemoryHandler(speaker, prev_model_d, **self.dialogue_object_parameters)
            else:
                return GetMemoryHandler(speaker, d, **self.dialogue_object_parameters)
        else:
            raise ValueError("Bad dialogue_type={}".format(d["dialogue_type"]))

    def ttad(self, s: str, model, chat_as_list=False) -> Dict:
        """Query TTAD model to get the action dict"""
        if s in self.ground_truth_actions:
            d = self.ground_truth_actions[s]
            logging.info('Found gt action for "{}"'.format(s))
        else:
            if chat_as_list:
                d = model.parse([s])
            else:
                d = model.parse(chat=s)  # self.ttad_model.parse(chat=s)

        # perform lemmatization on the chat
        logging.info('chat before lemmatization "{}"'.format(s))
        lemmatized_chat = sp(s)
        chat = " ".join(str(word.lemma_) for word in lemmatized_chat)
        logging.info('chat after lemmatization "{}"'.format(chat))

        # Get the words from indices in spans
        process_spans(d, re.split(r" +", s), re.split(r" +", chat))
        logging.info('ttad pre-coref "{}" -> {}'.format(chat, d))

        # log to sentry
        sentry_sdk.capture_message(
            json.dumps({"type": "ttad_pre_coref", "in_original": s, "out": d})
        )
        sentry_sdk.capture_message(
            json.dumps({"type": "ttad_pre_coref", "in_lemmatized": chat, "out": d})
        )
        return d
