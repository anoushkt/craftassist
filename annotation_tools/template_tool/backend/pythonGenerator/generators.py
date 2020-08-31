"""" This file defines a Generator class to generate surface form,
logical form pairs for templates saved using the template tool interface"""

import random
import json
from nested_lookup import nested_update
from nested_lookup import nested_lookup
from deepmerge import always_merger

path = './../templates.txt'
data_file = open(path, 'r')
data_read = json.loads(data_file.read())

# keys where the value is to be replaced by a span index
span_paths = [
  "block_type",
  "steps",
  "has_measure",
  "has_name",
  "has_size",
  "has_colour",
  "repeat_count",
  "ordinal",
  "has_block_type",
  "has_name",
  "has_size",
  "has_orientation",
  "has_thickness",
  "has_colour",
  "has_height",
  "has_length",
  "has_radius",
  "has_slope",
  "has_width",
  "has_base",
  "has_depth",
  "has_distance",
  "text_span",
  "pitch",
  "yaw",
  "yaw_pitch",
  "coordinates_span",
  "ordinal",
  "number"
]


def set_span(code, surface_form, span_value):
    """ This function sets the span value in a dictionary given
    a span value """
    span_array = span_value.split(" ")
    surface_form_words = surface_form.split(" ")
    start_span = surface_form_words.index(span_array[0])
    end_span = start_span + len(span_array) - 1
    span = [0, [start_span, end_span]]
    for spans in span_paths:
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
        generations = []
        while self.num < self.n:
            generations.append(self.next())
            self.num += 1
        print(generations)
        return generations

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
        key = cur_code.keys()[0]
        if nested_lookup(key, skeletal):
            # the parent key exists
            found = True
            cur_value = nested_lookup(key, skeletal)[0]
            new_value = always_merger.merge(cur_value, cur_code[key])
            nested_update(skeletal, key, new_value)
        if not found:
            skeletal = always_merger.merge(skeletal, cur_code)
    return generate_dictionary(code, i + 1, skeletal)


# initialise an array of generators
arrayOfObjects = []
spans = data_read['spans']
templatesSaved = data_read['templates']
for template in templatesSaved:
    templateContent = templatesSaved[template]
    info = {}
    if ('code' in templateContent.keys()):
        info['code'] = templateContent['code']
        if not isinstance(info['code'], list):
            # it is a template object
            info['code'] = [info['code']]
    else:
        # no code associated with the template
        info['code'] = {}
    info['spans'] = spans
    info['surfaceForms'] = templateContent['surfaceForms']

    if not isinstance(info['surfaceForms'][0], list):
        # it is a surface form
        info['surfaceForms'] = [info['surfaceForms']]

    arrayOfObjects.append(Generator(info))

for obj in arrayOfObjects:
    # generate logical-surface form pair array for the template
    obj.__generate__()
