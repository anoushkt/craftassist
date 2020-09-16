"""" This file defines a Generator class to generate surface form,
logical form pairs for templates saved using the template tool interface"""

import random
import json
from nested_lookup import nested_update
from nested_lookup import nested_lookup
from deepmerge import always_merger
from pprint import pprint
import copy
import xml.etree.ElementTree as ET


path = './../templates.txt'
data_file = open(path, 'r')
data_read = json.loads(data_file.read())


def getSpanKeys(d):
    if d is None:
        return
    for k, v in d.items():
        if v == '':
            yield k
        elif type(v) == dict:
            yield from getSpanKeys(v)


def set_span(code, surface_form, span_value):
    """ This function sets the span value in a dictionary given
    a span value """
    span_array = span_value.split(" ")
    surface_form_words = surface_form.split(" ")
    start_span = surface_form_words.index(span_array[0])
    end_span = start_span + len(span_array) - 1
    span = [0, [start_span, end_span]]
    spanKeys = getSpanKeys(copy.deepcopy(code))   
    for spans in spanKeys:
        code = nested_update(code, key=spans, value=span)
    return code


class Generator():
    """This is a Generator class that is initialised for templates
    using template information saved from the template interface """

    def __init__(self, information):

        # change this to change the number of generations
        self.n = 1
        self.num = 0

        # information about the template
        self.info = information

    def __iter__(self):
        return self

    # Python 3 compatibility
    def __next__(self):
        return self.next()

    def __generate__(self):
        # generation = None
        # while self.num < self.n:
        #     generations.append(self.next())
        #     self.num += 1
        # print(generations[0])
        generation = self.next()
        return generation

    def next(self):
        """ next function following the iterable pattern """
        cur = self.get_generation()
        return cur

    def get_generation(self):
        """ This function returns the generations for a template """
        return generate_template(self.info)


def generate_template(info):
    """ This function generates template surface-logical
     forms given information about the template """
    surface_form = ""
    chosen_surface_forms = []
    for target_list in info["surfaceForms"]:
        if target_list:
            choose_surface_form = random.choice(target_list)
            surface_form += choose_surface_form + " "
            chosen_surface_forms.append(choose_surface_form)
        else:
            # no surface form associated with the template object
            chosen_surface_forms.append("")
    try:
        for i in range(len(info["code"])):
            cur_code = info["code"][i]
            try:
                span_value = spans[chosen_surface_forms[i]]
            except BaseException:
                # no span value
                span_value = chosen_surface_forms[i]
            # set the span
            info["code"][i] = set_span(cur_code, surface_form, span_value)
    except BaseException:
        # no logical form associated with the template object
        info["code"] = {}
    dictionary = {}
    dictionary = generate_dictionary(info["code"])
    return [surface_form, dictionary]


def generate_dictionary(code, i=0, skeletal=None):
    """ This function generates the action dictionary given an array
    of action dictionaries """
    if skeletal is None:
        skeletal = {}
    if i == len(code):
        # all action dictionaries have been merged
        return skeletal
    found = False
    if code[i]:
        cur_code = code[i]
        key = list(cur_code.keys())[0]
        if nested_lookup(key, skeletal):
            # the parent key exists
            found = True
            cur_value = nested_lookup(key, skeletal)[0]
            new_value = always_merger.merge(cur_value, cur_code[key])
            nested_update(skeletal, key, new_value)
        if not found:
            skeletal = always_merger.merge(skeletal, cur_code)
    return generate_dictionary(code, i=i + 1, skeletal=skeletal)


def getBLockType(savedBlocks, block_name):
    treeOne = ET.fromstring(savedBlocks[block_name])
    block_type = treeOne[0].attrib['type']
    return block_type


def update_list_value(d, rnd_index):
    new_d = copy.deepcopy(d)
    for k, v in d.items():
        if type(v) == list:
            new_d[k] = v[rnd_index]
        elif type(v) == dict:
            new_d[k] = update_list_value(v, rnd_index)
        else:
            new_d[k] = v
    return new_d


def fixTemplatesWithRandomBlock(codeList, surfaceFormList):
    updatedCodeList, updatedSurfaceFormList = [], []
    for code, surfaceForm in zip(codeList, surfaceFormList):
        if type(surfaceForm[0]) == list:
            rnd_index = random.choice(range(len(surfaceForm)))
            if code == None:
                updatedCodeList.append(code)
            # code is list
            if type(code) == list:
                updatedCodeList.append(code[rnd_index])
            else:
                # code has a nested list somewhere in the dict
                updatedCode = update_list_value(code, rnd_index)
                updatedCodeList.append(updatedCode)
            updatedSurfaceFormList.append(surfaceForm[rnd_index])
        else:
            updatedCodeList.append(code)
            updatedSurfaceFormList.append(surfaceForm)
    return updatedCodeList, updatedSurfaceFormList


# initialise an array of generators
arrayOfObjects = []
spans = data_read['spans']
templatesSaved = data_read['templates']
savedBlocks = data_read['savedBlocks']

for k, v in templatesSaved.items():
    templateContent = v
    templateContentCopy = copy.deepcopy(templateContent)

    # fix random blocks to have one code block and one surface form
    if getBLockType(savedBlocks, k) == "random":
        rnd_index = random.choice(range(len(templateContent['code'])))
        code = templateContent['code'][rnd_index]
        surfaceForm = templateContent['surfaceForms'][rnd_index]
        templateContentCopy['code'] = code
        templateContentCopy['surfaceForm'] = surfaceForm
    info = {}
    info['code'] = {}
    # check for random templates
    i += 1
    if ('code' in templateContentCopy.keys()):
        if not isinstance(templateContentCopy['code'], list):
            # skip template objects...
            # info['code'] = [info['code']]
            continue
        info['code'] = templateContentCopy['code']
    # Template object with no code
    if not info['code']:
        continue
    
    info['spans'] = spans
    info['surfaceForms'] = templateContentCopy['surfaceForms']

    if not isinstance(info['surfaceForms'][0], list):
        # it is a surface form
        info['surfaceForms'] = [info['surfaceForms']]

    code, surfaceForm = fixTemplatesWithRandomBlock(info['code'], info['surfaceForms'])
    info['code'] = code
    info['surfaceForms'] = surfaceForm
    arrayOfObjects.append([k, Generator(info)])


for obj in arrayOfObjects:
    template_name, generation_obj = obj
    # generate logical-surface form pair array for the template
    generation_pair = generation_obj.__generate__()
    # print(template_name)
    print(generation_pair[0])
    pprint(generation_pair[1])
    print()
