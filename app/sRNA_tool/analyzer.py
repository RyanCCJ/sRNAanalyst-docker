from django.core.files.storage import default_storage
from shlex import quote
import copy
import json
import os
import oyaml as yaml
import pandas as pd
import sys

BASE_DIR = os.path.abspath(__file__ + '/../../')

# import sRNAanalyst CLI tool
sys.path.insert(0, BASE_DIR+'/src/toolkit/sRNAanalyst')
from analyze import set_config, run
from len2bin import change_format


def read_config(file_path):
    config = {}
    with open(file_path, 'r') as f:
        try:
            config = yaml.safe_load(f)
        except yaml.YAMLError as exc:
            print(exc)
    return config


def post_preprocess(request, tool, JOB_ID):

    def _detect_injection(config):
        for val in [';','|','`','$','&','>','<']:
            if val in config:
                return True
        if len(config)>50:
            return True
        else:
            return False

    def _save_and_run(config, tool):
        # relative path for src/
        config['output_dir'] = os.path.join('../media/', JOB_ID)
        config['input_file'] = os.path.join('../media/', JOB_ID, 'upload', tool, config['input_file'])
        # absolute path
        path = quote( os.path.join(BASE_DIR, 'media/', JOB_ID, tool+'.yml') )
        with open(path, 'w') as f:
            yaml.dump(config, f, default_flow_style=False)
        os.system('sh {}/src/script/{}.sh {}'.format(BASE_DIR, tool, path))

    config = json.loads(request.POST['config'])

    if tool=='workflow':
        for step in ['trimming','normalization','mapping']:
            if _detect_injection(config[step]['extra_args']): return 1
            if 'reference' in config[step] and config[step]['reference'] != '':
                path = os.path.join('../media/', JOB_ID, 'upload', tool, config[step]['reference'])
                config[step]['reference'] = path
        for step in ['nor', 'map']:
            if 'reference_'+step in request.FILES:
                file = request.FILES['reference_'+step]
                path = os.path.join(JOB_ID, 'upload', tool, file.name)
                if os.path.exists(BASE_DIR+'/media/'+path):
                    os.remove(BASE_DIR+'/media/'+path)
                file_name = default_storage.save(path, file)
        
    elif tool=='utility':
        if config['reference'] != '':
            path = os.path.join('../media/', JOB_ID, 'upload', tool, config['reference'])
            config['reference'] = path
        if 'reference' in request.FILES:
            file = request.FILES['reference']
            path = os.path.join(JOB_ID, 'upload', tool, file.name)
            if os.path.exists(BASE_DIR+'/media/'+path):
                os.remove(BASE_DIR+'/media/'+path)
            file_name = default_storage.save(path, file)

    _save_and_run(config, tool)

    return 0


def get_preprocess(tool, JOB_ID):

    base_path = os.path.join('/sRNAanalyst_media/', JOB_ID)
    link_path, csv_path, img_path = [],[],[]

    try:
        config = read_config( os.path.join(BASE_DIR,'media/',JOB_ID,tool+'.yml') )
    except:
        return { 'csv_path': csv_path }

    if tool=='workflow':
        # trimming
        if config['trimming']['active']:
            link_path.append(os.path.join(base_path,'fastqc','before_trimming',config['data']+'_fastqc.html'))
            link_path.append(os.path.join(base_path,'fastqc','after_trimming',config['data']+'_trimmed_fastqc.html'))
            img_path.append(os.path.join(base_path,'fastqc','after_trimming',config['data']+'_trimmed_fastqc','Images','per_base_quality.png'))
        csv_path.append(config['data']+'_collapsed.fa')
        
        # normalization
        norm_facotr = None
        if config['normalization']['active']:
            with open(os.path.join(BASE_DIR,'media/',JOB_ID,'log/norm_factor.log')) as f:
                norm_facotr = f.read()[:-1]
        
        # mapping
        log = None
        if config['mapping']['active']:
            if config['mapping']['tool']=='bowtie2':
                csv_path.append(config['data']+'_mapped.sam')
                with open(os.path.join(BASE_DIR,'media/',JOB_ID,'log/bowtie2.log')) as f:
                    log = f.read()
            else:
                with open(os.path.join(BASE_DIR,'media/',JOB_ID,config['data']+'_filtered.fa'), 'rbU') as f:
                    log = "{} reads; of these:\n".format(sum(1 for _ in f)/2)
            try:
                df = pd.read_csv(os.path.join(BASE_DIR,'media/',JOB_ID,config['data']+'.csv'), comment='#')
                site_length = len(df)
                read_length = round(df['read_count'].sum(), 5)
                log += "# of site: <b>{}</b>, # of read-count: <b>{}</b>".format(site_length, read_length)
                csv_path.append(config['data']+'.csv')
            except: pass

        path = {
            'config': config,
            'link_path': link_path,
            'csv_path': csv_path,
            'img_path': img_path,
            'norm_facotr': norm_facotr,
            'log': log,
        }

    elif tool=='utility':
        csv_path.append(config['data']+'_preprocess.'+config['format'])
        path = { 
            'config': config,
            'csv_path': csv_path,
            'img_path': img_path, 
        }

    return path


def post_analysis(request, tool, JOB_ID):

    def _load_config(id):
        base_dir = os.path.join(BASE_DIR, 'src/config/')
        job_dir = os.path.join(BASE_DIR, 'media/', id)
        config_path = ['/run_config.yml', '/plot_config.yml']
        
        '''
        config_path = ['/run_config.yml', '/plot_config.yml']
        for i in range(len(config_path)):
            if os.path.exists(job_dir + config_path[i]):
                config_path[i] = job_dir + config_path[i]
            else:
                config_path[i] = base_dir + config_path[i]
        '''

        config = {
            'analysis_config': read_config(base_dir+'analysis.yml'),
            'samples': read_config(base_dir+'samples.yml'),
            'run_config': read_config(base_dir+'/run_config.yml'),
            'plot_config': read_config(base_dir+'/plot_config.yml'),
            # 'stylesheet': read_config(base_url+'stylesheet.yml'),
        }
        return config

    def _check_input(frontend_config):
        # if frontend_config['run_config']['reference']=='':
        #    del frontend_config['run_config']['reference']
        for i, data in enumerate(frontend_config['run_config']['data']):
            if ('upload' in data) and 'upload':
                path = os.path.join(BASE_DIR, 'media/', JOB_ID, 'upload/dataset/', data['name'])
                df = pd.read_csv(path, comment='#')
                frontend_config['run_config']['data'][i]['dataframe'] = df
        
        for i, filter in enumerate(frontend_config['plot_config']['filter']):
            if ('upload' in filter) and 'upload':
                path = os.path.join(BASE_DIR, 'media/', JOB_ID, 'upload/group/', filter['name'])
                with open(path, 'r') as f:
                    frontend_config['plot_config']['filter'][i]['id'] = f.read().splitlines()
        return frontend_config

    def _update_frontend(config, frontend_config, analysis_config, tool):

        # Note. dictionary in Python is "Call by Reference"
        # run_config
        frontend_config = _check_input(frontend_config)
        run_target = config['run_config'][analysis_config['run_dict'][tool]]
        run_target.update(frontend_config['run_config'])
        run_target['run'] = True
        run_target['csv_path'] += JOB_ID + '/'
        csv_path = run_target['csv_path']
        columns = run_target['columns']
        if run_target['columns'] == None:
            columns = run_target['reference']['dataframe'].columns.tolist()
            columns.remove('ref_id')
            run_target['columns'] = columns
            
        # plot_config
        for i in range(len(analysis_config['plot_dict'][tool])):
            plot_target = config['plot_config'][analysis_config['plot_dict'][tool][i]]
            plot_target.update(copy.deepcopy(frontend_config['plot_config']))
            plot_target['plot'] = True
            plot_target['fig_path'] += JOB_ID + '/' + analysis_config['plot_dict'][tool][i]
            if len(analysis_config['plot_dict'][tool]) == 2:
                plot_target['title'] = plot_target['title_'+str(i+1)]
            for j in range(len(plot_target['data'])):
                name = plot_target['data'][j]['name']
                if (tool=='density') or (tool=='fold') or (tool=='scatter'):
                    plot_target['columns'] = columns
                    annot = '-'.join(columns)
                elif (tool=='boundary') or (tool=='codon'):
                    limit = run_target['limit']
                    annot = '{}({}-{})'.format(columns[i],limit[i][0],limit[i][1])
                else:
                    annot = ''
                plot_target['data'][j]['path'] = csv_path + name + analysis_config['meta_dict'][tool] + annot +'.csv'

        return config

    def _remove_img(analysis_config, tool):
        for dirs, subdirs, files in os.walk(os.path.join(BASE_DIR,'media/',JOB_ID)):
            for f in files:
                for cf in analysis_config['plot_dict'][tool]:
                    new_f = f.split('_')
                    new_f.pop()
                    new_f = '_'.join(new_f)
                    if new_f == cf:
                        os.remove(os.path.join(dirs, f))

    def _run_analysis(config, frontend_config, analysis_config, tool):
        config = _update_frontend(config, frontend_config, analysis_config, tool)
        config = set_config(config, tool, set_stylesheet=False)
        run(config, tool)

    def _save_config(config, analysis_config, tool):

        # read old config
        new_config = {}
        for type in ['run_config', 'plot_config']:
            path = os.path.join(BASE_DIR, 'media/', JOB_ID, type+'.yml')
            if os.path.exists(path):
                new_config[type] = read_config(path)
            else:
                new_config[type] = config[type]

        # update run_config
        run_target = config['run_config'][analysis_config['run_dict'][tool]]
        run_target['reference']['dataframe'] = None
        for i in range(len(run_target['data'])):
            run_target['data'][i]['dataframe'] = None
        new_config['run_config'][analysis_config['run_dict'][tool]] = run_target

        # update plot_config
        for i in range(len(analysis_config['plot_dict'][tool])):
            plot_target = config['plot_config'][analysis_config['plot_dict'][tool][i]]
            plot_target['reference'] = run_target['reference']['name']
            for j in range(len(plot_target['data'])):
                plot_target['data'][j]['dataframe'] = None
            for j in range(len(plot_target['filter'])):
                plot_target['filter'][j]['id'] = None
            new_config['plot_config'][analysis_config['plot_dict'][tool][i]] = plot_target

        # save config
        for type in ['run_config', 'plot_config']:
            path = os.path.join(BASE_DIR, 'media/', JOB_ID, type+'.yml')
            with open(path, 'w') as f:
                yaml.dump(new_config[type], f, default_flow_style=False)
            
    # save reference
    dirs = [
        os.path.join(BASE_DIR, 'media/', JOB_ID, 'reference'),
        os.path.join(BASE_DIR, 'media/', JOB_ID, 'reference', tool),
    ]
    for dir in dirs: 
        if not os.path.isdir(dir):
            os.mkdir(dir)  
    if 'reference' in request.FILES:
        ref_file = request.FILES['reference']
        path = os.path.join(JOB_ID, 'reference', tool, ref_file.name)
        if os.path.exists(BASE_DIR+'/media/'+path):
            os.remove(BASE_DIR+'/media/'+path)
        file_name = default_storage.save(path, ref_file)
    
    # merge analysis config
    config = _load_config(JOB_ID)
    analysis_config = config['analysis_config']
    frontend_config = json.loads(request.POST['config'])
    path = os.path.join(BASE_DIR, 'media', JOB_ID, 'reference', tool, frontend_config['run_config']['reference'])
    frontend_config['run_config']['reference'] = { 
        'name': frontend_config['run_config']['reference'],
    }
    df = pd.read_csv(path, comment='#')

    # change length to region
    if tool=='metagene':
        bin_size = 100
        df = change_format(df, bin_size)
    frontend_config['run_config']['reference']['dataframe'] = df  

    # remove old result
    _remove_img(analysis_config, tool)

    # conduct new analysis
    _run_analysis(config, frontend_config, analysis_config, tool)

    # save config file
    _save_config(config, analysis_config, tool)
    
    # save data config
    if 'data' in request.POST:
        config = json.loads(request.POST['data'])
        path = os.path.join(BASE_DIR, 'media/', JOB_ID, 'data.yml')
        with open(path, 'w') as f:
            yaml.dump(config, f, default_flow_style=False)

    return 0


def get_analysis(tool, JOB_ID):

    def _load_config(id):
        job_dir = os.path.join(BASE_DIR, 'media/', id)
        config = {
            'analysis_config': read_config(BASE_DIR+'/src/config/analysis.yml'),
            'run_config': read_config(job_dir+'/run_config.yml'),
            'plot_config': read_config(job_dir+'/plot_config.yml'),
        }
        return config
    
    def _collect_config(config, tool):
        if tool=='boundary' or tool=='codon':
            key = config['analysis_config']['run_dict'][tool]
            limit = config['run_config'][key]['limit']
            key = config['analysis_config']['plot_dict'][tool][0]
            config['plot_config'][key]['limit']  = limit 
        key = config['analysis_config']['plot_dict'][tool][0] 
        return config['plot_config'][key]           

    def _collect_csv(config, tool):
        csv_path = []
        cf = config['run_config'][config['analysis_config']['run_dict'][tool]]
        if cf['run']:
            for i in range(len(cf['data'])):
                name = cf['data'][i]['name']
                if tool == 'density' or tool == 'fold' or tool == 'scatter':
                    column_name = '-'.join(cf['columns'])
                    csv_path.append(os.path.join(
                        'src', cf['csv_path'], JOB_ID, "{}_region_{}.csv".format(name, column_name)))
                elif tool == 'metagene':
                    csv_path.append(os.path.join(
                        'src', cf['csv_path'], JOB_ID, "{}_metagene.csv".format(name)))
                elif tool == 'boundary' or tool == 'codon':
                    for j in range(len(cf['columns'])):
                        csv_path.append(os.path.join('src', cf['csv_path'], JOB_ID, "{}_position_{}({}-{}).csv".format(
                            name, cf['columns'][j], cf['limit'][j][0], cf['limit'][j][1])))
            csv_path = [path.split('/')[-1] for path in csv_path]
        return csv_path

    def _collect_img(config, tool):
        img_path, file_path = [], []
        for dirs, subdirs, files in os.walk(os.path.join(BASE_DIR,'media/',JOB_ID)):
            for f in files:
                for cf in config['analysis_config']['plot_dict'][tool]:
                    new_f = f.split('_')
                    new_f.pop()
                    new_f = '_'.join(new_f)
                    if new_f == cf:
                        img_path.append(os.path.join(dirs, f))
                        file_path.append(f)
        img_path = sorted(['/sRNAanalyst_'+'/'.join(path.split('/')[-3:]) for path in img_path])
        if tool == 'boundary' or tool == 'codon':
            new_path = [[], []]
            for img in file_path:
                new_img = img.split('.')[0].split('_')
                new_img.pop()
                new_img = '_'.join(new_img)
                i = config['analysis_config']['plot_dict'][tool].index(new_img)
                new_path[i].append(img)
            new_path[0] = sorted(new_path[0])
            new_path[1] = sorted(new_path[1])
            img_path = []
            for i in range(len(new_path[0])):
                img_path.append(new_path[0][i])
                img_path.append(new_path[1][i])
            img_path = [os.path.join('/sRNAanalyst_media/', JOB_ID, path) for path in img_path]

        return img_path

    try:
        config = _load_config(JOB_ID)
        path = {
            'config': _collect_config(config, tool),
            'csv_path': _collect_csv(config, tool),
            'img_path': _collect_img(config, tool),
        }
        return path
    except:
        return { 'csv_path': [] }

