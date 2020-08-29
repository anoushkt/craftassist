#!/bin/env python
from nested_lookup import *
from deepmerge import always_merger
import random

spans={"5 steps":"5","10 steps":"10","20 steps":"20","of size 19":"19","of size 10":"10","of size 20":"20"}
surfaceForms=[["5 steps","10 steps","20 steps"],["of size 19","of size 10"]]
code=[{"location":{"steps":" "}}, {"location":{"has_size":" "}}]

info={"code":code, "surfaceForms":surfaceForms, "spans":spans}

def iter_paths(d):
    def iter1(d, path):
        paths = []
        for k, v in d.items():
            if isinstance(v, dict):
                paths += iter1(v, path + [k])
            paths.append((path + [k]))
        return paths
    return iter1(d, [])

spanPaths=[
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

def setSpan(code, surfaceForm, spanValue):

    spanArray=spanValue.split(" ")
    surfaceFormWords=surfaceForm.split(" ")
    startSpan=surfaceFormWords.index(spanArray[0])
    endSpan=startSpan+len(spanArray)-1
    span=[0,[startSpan,endSpan]]
    for spans in spanPaths:
        code=nested_update(code, key=spans, value=span)
    return code

# Using the generator pattern (an iterable)
class generator(object):
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
        generations=""
        while self.num<self.n:
            generations+=self.next()+"\n"
            self.num+=1
        return generations
    
    def next(self):
        cur= self.getGeneration()
        return cur

    def getGeneration(self):
        info2=self.info
        return generateTemplate(info2)



def generateTemplate(info):
    surfaceForm=""
    chosenSurfaceForms=[]
    #print(info)
    #print(info[surfaceForms])
    for target_list in info["surfaceForms"]:
        chooseSurfaceForm=random.choice(target_list)
        surfaceForm+=chooseSurfaceForm+" "
        chosenSurfaceForms.append(chooseSurfaceForm)
    for i in range(len(info["code"])):
        curCode=info["code"][i]
        spanValue=spans[chosenSurfaceForms[i]]
        info["code"][i]=setSpan(curCode,surfaceForm,spanValue)
    
    #print(code)
    dictionary=generateDictionary(info["code"])
    print(dictionary)
    return surfaceForm


def generateDictionary(code,i=0,skeletal={}):
    #print(code)
    if(i==len(code)):
        return skeletal

    found=False
    if(code[i]):
        curCode=code[i]
        paths=iter_paths(code[i])
        key=curCode.keys()[0]
        if(nested_lookup(curCode, code[i])):
            found=True
            curValue=nested_lookup(curCode,code[i])
            newValue=always_merger.merge(curValue, curCode[key])
            nested_update(curCode, key, newValue)

        if(not found):
            skeletal= always_merger.merge(skeletal, curCode)

    
    return generateDictionary(code, i+1, skeletal)







obj1=generator(info)
print(obj1.__generate__())


