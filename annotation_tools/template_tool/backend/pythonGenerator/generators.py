import random
import json
from nested_lookup import nested_update
from nested_lookup import nested_lookup
from deepmerge import always_merger

path = './../templates.txt'
data_file = open(path,'r')
data_read=json.loads(data_file.read())

def iter_paths(d):
    def iter1(d, path):
        paths = []
        for k, v in d.items():
            if isinstance(v, dict):
                paths += iter1(v, path + [k])
            paths.append((path + [k]))
        return paths
    return iter1(d, [])

span_paths=[
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
]

def set_span(code, surface_form, span_value):

    span_array=span_value.split(" ")
    surface_form_words=surface_form.split(" ")
    start_span=surface_form_words.index(span_array[0])
    end_span=start_span+len(span_array)-1
    span=[0,[start_span,end_span]]
    for spans in span_paths:
        code=nested_update(code, key=spans, value=span)
    return code

# Using the generator pattern (an iterable)
class Generator():
    def __init__(self,info):
        self.n = 1
        self.num = 0
        self.info=info

    def __iter__(self):
        return self

    # Python 3 compatibility
    def __next__(self):
        return self.next()

    def __generate__(self):
        generations=[]
        while self.num<self.n:
            generations.append(self.next())
            self.num+=1
        print (generations)
        return generations

    def next(self):
        cur= self.get_generation()
        return cur

    def get_generation(self):
        info2=self.info
        return generate_template(info2)



def generate_template(info):
    surface_form=""
    chosen_surface_forms=[]
    #print(info)
    #print(info[surfaceForms])
    for target_list in info["surfaceForms"]:
        if target_list:
            choose_surface_form=random.choice(target_list)
            surface_form+=choose_surface_form+" "
            chosen_surface_forms.append(choose_surface_form)
        else:
            chosen_surface_forms.append("")
    try:
        for i in range(len(info["code"])):
            cur_code=info["code"][i]
            try:
                span_value=spans[chosen_surface_forms[i]]
            except:
                span_value=chosen_surface_forms[i]
            info["code"][i]=set_span(cur_code,surface_form,span_value)
    except:
        info["code"]={}
    #print(code)
    dictionary=generate_dictionary(info["code"])
    #print(dictionary)
    return [surface_form,dictionary]


def generate_dictionary(code,i=0,skeletal={}):
    #print(code)
    if i==len(code):
        return skeletal

    found=False
    if code[i]:
        cur_code=code[i]
        paths=iter_paths(code[i])
        key=cur_code.keys()[0]
        if nested_lookup(cur_code, code[i]):
            found=True
            cur_value=nested_lookup(cur_code,code[i])
            new_value=always_merger.merge(cur_value, cur_code[key])
            nested_update(cur_code, key, new_value)

        if not found:
            skeletal= always_merger.merge(skeletal, cur_code)
    return generate_dictionary(code, i+1, skeletal)

arrayOfObjects=[]
spans=data_read['spans']
templatesSaved=data_read['templates']
for template in templatesSaved:
    templateContent=templatesSaved[template]
    info={}
    try:
        info['code']=templateContent['code']
        if not isinstance(info['code'], list):
            info['code']=[info['code']]
    except:
        pass
    #print(info['surfaceForms'])
    info['spans']=spans
    info['surfaceForms']=templateContent['surfaceForms']
    if not isinstance(info['surfaceForms'][0], list):
        info['surfaceForms']=[info['surfaceForms']]
    #print(info)
    arrayOfObjects.append(Generator(info))

#16
print(arrayOfObjects[16].info)
arrayOfObjects[16].__generate__()
