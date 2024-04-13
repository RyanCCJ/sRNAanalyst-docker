from django.http import HttpResponse, JsonResponse, FileResponse
from django.core.files.storage import default_storage
from django.shortcuts import render
from distutils.dir_util import copy_tree
from . import analyzer, browser
import os
import oyaml as yaml
import random
import string
import json
import pandas as pd

BASE_DIR = os.path.abspath(__file__ + '/../../')


# home page
def index(request):

    # create random job ID
    while(True):
        JOB_ID = ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(6))
        if os.path.isdir(BASE_DIR+'/media/'+JOB_ID):
            continue
        else:
            print("[sRNA Analyst] User ID Login: {}".format(JOB_ID))
            break
    
    database = analyzer.read_config(BASE_DIR + '/src/config/database.yml')
    datas = {
        'dataset': database['data'],
        'reference': database['reference'],
        'list': database['list'],
    }
    HCL = False

    return render(request, 'index.html', locals())


# home page for HCL
def HCL(request):

    # create random job ID
    while(True):
        JOB_ID = ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(6))
        if os.path.isdir(BASE_DIR+'/media/'+JOB_ID):
            continue
        else:
            break

    database = analyzer.read_config(BASE_DIR + '/src/config/database_HCL.yml')
    datas = {
        'dataset': database['data'],
        'reference': database['reference'],
        'list': database['list'],
    }
    HCL = True

    return render(request, 'index.html', locals())


# get list detail in database page
def list(request, list):
    path = os.path.join(BASE_DIR, 'data/target/', list+'.csv')
    df = pd.read_csv(path)
    json_string = df.to_json(orient='records')
    trans_data = json.loads(json_string)
    return JsonResponse(trans_data, safe=False)


# get list detail for HCL
def HCL_list(request, list):
    path = BASE_DIR + '/data/list/HCL/' + list
    with open(path, 'r') as f:
        trans = f.read().splitlines()
    df = pd.read_csv(BASE_DIR+'/data/mRNA_WS275_IDtoName.csv', index_col='Gene name')
    df = df.loc[trans].reset_index().rename(columns={'Gene name':'Transcript Name'})
    json_string = df.to_json(orient='records')
    trans_data = json.loads(json_string)
    return JsonResponse(trans_data, safe=False)


# RESTful API for job ID
def api(request, id, type=None, tool=None):

    def _data_config(id):
        if id=='HCL':
            return analyzer.read_config(BASE_DIR+'/src/config/database_HCL.yml')
        else:
            return analyzer.read_config(BASE_DIR+'/src/config/database.yml')

    def _http_response(status):
        if status==0:
            msg = "Analysis complete."
            return HttpResponse(msg, status=200)
        elif status==1:
            msg = "Invalid arguments."
            return HttpResponse(msg, status=406)
        else:
            msg = "Something wrong."
            return HttpResponse(msg, status=500)
     
    JOB_dir = os.path.join(BASE_DIR, 'media/', id)
    pre_tools = ['workflow','utility']
    ana_tools = ['density','metagene','boundary','codon','fold','scatter']

    if request.method=='GET':

        if type=='dataset':
            data_config = _data_config(id)
            for data in data_config['data']:
                if data['name']==tool: path=data['path']
            file = open(os.path.join(BASE_DIR, path), 'rb')
            return FileResponse(file)
        
        elif type=='reference':
            data_config = _data_config(id)
            for data in data_config['reference']:
                if data['name']==tool: path=data['path']
            file = open(os.path.join(BASE_DIR, path), 'rb')
            return FileResponse(file)
            
        elif type == 'list':
            data_config = _data_config(id)
            for data in data_config['list']:
                if data['name']==tool: path=data['path']
            file = open(os.path.join(BASE_DIR, path), 'rb')
            return FileResponse(file)
    
        elif os.path.isdir(JOB_dir):
            
            if type=='preprocess':
                if tool=='all':
                    print("[sRNA Analyst] User ID Login: {}".format(id))
                    path = {}
                    for tool in pre_tools:
                        path[tool] = analyzer.get_preprocess(tool, id)
                else:
                    path = analyzer.get_preprocess(tool, id)
                return JsonResponse(path)
            
            elif type=='analysis':
                if tool=='all':
                    print("[sRNA Analyst] User ID Login: {}".format(id))
                    path = {}
                    # load data
                    data_config = os.path.join(JOB_dir, 'data.yml')
                    if os.path.exists(data_config):  
                        data = analyzer.read_config(data_config)
                        path['data'] = data
                    else:
                        path['data'] = {}
                    # load result
                    path['browser'] = browser.get_browser(id)
                    for tool in ana_tools:
                        path[tool] = analyzer.get_analysis(tool, id)    
                
                elif tool=='browser':
                    path = browser.get_browser(id)

                else:
                    path = analyzer.get_analysis(tool, id)
                return JsonResponse(path)
            
            # check detail browser
            elif type=='site':
                data = browser.get_site(tool, id)
                return JsonResponse(data)

            else:
                msg = "Unknown type of operation."
                return HttpResponse(msg, status=404)
        else:
            msg = "Invalid job ID."
            return HttpResponse(msg, status=404)
    
    elif request.method=='POST':
        
        if not os.path.isdir(JOB_dir):
            os.mkdir(JOB_dir) 

        # load example
        if tool=='example':
            example_dir = os.path.join(BASE_DIR, 'static/example/job', type)
            copy_tree(example_dir, JOB_dir)
            upload_dir = os.path.join(BASE_DIR, 'static/example/job/upload')
            copy_tree(upload_dir, JOB_dir+'/upload')
            upload_dir = os.path.join(BASE_DIR, 'static/example/job/reference')
            copy_tree(upload_dir, JOB_dir+'/reference')
            return _http_response(0)

        # upload file
        elif type=='file':
            target = 'group' if (tool == 'groups') else tool
            dirs = [
                os.path.join(JOB_dir, 'upload'),
                os.path.join(JOB_dir, 'upload', target),
            ]
            for dir in dirs:
                if not os.path.isdir(dir):
                    os.mkdir(dir)
            file = request.FILES['file']
            msg = ""

            # write multi-groups into separate files
            if tool == 'groups':
                try:
                    ref = json.loads(request.POST['reference'])
                except:
                    ref = {}

                df = pd.read_csv(file.file, low_memory=False)
                for col in df.columns:
                    msg += (col + '|')
                    lst = df[col].dropna().to_list()
                    new_lst = []

                    # gene-to-transcript conversion
                    if ref:
                        for gene in lst:
                            if gene in ref:
                                new_lst += ref[gene]
                            else:
                                new_lst.append(gene)
                    else:
                        new_lst = lst
                    
                    path = os.path.join(dirs[1], col)
                    with open(path, 'w') as f:
                        f.write('\n'.join(new_lst))
                msg = msg[:-1]
            
            else:
                if (tool =='dataset') or (tool =='group'):
                    if ((file.name[-4:]=='.csv') or (file.name[-4:]=='.txt')):
                        name = file.name[:-4]
                    else:
                        name = file.name
                    path = os.path.join(dirs[1], name)
                else:
                    path = os.path.join(dirs[1], file.name)
                if os.path.exists(path): os.remove(path)
                file_name = default_storage.save(path, file)
            
            # save data config
            if 'data' in request.POST:
                config = json.loads(request.POST['data'])
                path = os.path.join(BASE_DIR, 'media/', id, 'data.yml')
                with open(path, 'w') as f:
                    yaml.dump(config, f, default_flow_style=False)

            return HttpResponse(msg, status=201)
        
        # check dataset browser
        elif tool=='browser':
            status = browser.post_browser(request, id)
            return _http_response(status)

        # upload YAML and run preprocess
        elif type=='preprocess':
            status = analyzer.post_preprocess(request, tool, id)
            return _http_response(status)
        
        # upload YAML and run analysis
        elif type=='analysis':      
            status = analyzer.post_analysis(request, tool, id)
            return _http_response(status)
        
        else:
            msg = "Unknown type of operation."
            return HttpResponse(msg, status=404)
        
    elif request.method=='DELETE':  
        # prevent file-path injection
        tool = tool.split('/')[-1]
        if type == 'group':
            try:
                os.remove(os.path.join(JOB_dir, 'upload', type, tool))
                return HttpResponse(status=201)
            except:
                msg = "File not found."
                return HttpResponse(msg, status=404)
        else:
            msg = "Unknown type of file."
            return HttpResponse(msg, status=404)
            
    else:
        # 400 Bad Request
        return HttpResponse(status=400)

