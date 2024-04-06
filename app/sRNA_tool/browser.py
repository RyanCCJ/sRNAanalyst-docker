from django.core.files.storage import default_storage
import json
import os
import oyaml as yaml
import pandas as pd
import re
import sys

BASE_DIR = os.path.abspath(__file__ + '/../../')

# import sRNAanalyst CLI tool
sys.path.insert(0, BASE_DIR+'/src/toolkit/sRNAanalyst')
from utility import add_pvalue

def read_config(file):
    config = {}
    with open(file, 'r') as f:
        try:
            config = yaml.safe_load(f)
        except yaml.YAMLError as exc:
            print(exc)
    return config

def read_fasta(file):

    i = -1
    id = []
    seq = []
    with open(file, 'r') as f:
        for line in f:
            if line[0]=='>':
                id.append(line[1:-1])
                seq.append('')
                i += 1
            else:
                seq[i] += line[:-1]     
    df = pd.DataFrame(list(zip(id,seq)), columns=['ref_id','ref_seq'])
    
    # detect description field
    tmp_df = pd.DataFrame(df['ref_id'].str.split().to_list())
    for i in tmp_df.columns:
        annotation =  tmp_df.loc[0,i].split('=')
        if len(annotation)>1:
            annotation = annotation[0]
            tmp_df[i] = tmp_df[i].str[len(annotation)+1:]
            tmp_df = tmp_df.rename(columns={i:annotation})
    df = pd.concat([df,tmp_df], axis=1)
    del df['ref_id']
    df = df.rename(columns={0:'ref_id'})
    
    return df

def get_browser(JOB_ID):
    try:
        path = os.path.join(BASE_DIR, 'media/', JOB_ID, 'transcript.csv')
        df = pd.read_csv(path)
        table = json.loads(json.dumps(df.to_dict(orient='records')))
        path = os.path.join(BASE_DIR, 'media/', JOB_ID, 'plot_config.yml')
        plot_config = read_config(path)
        return {
            'table': table,
            'config': plot_config['Browser'],
        }
    except:
        return {}

# generate target RNA table
def post_browser(request, JOB_ID):

    def _read_dataset(data, groups):

        path = os.path.join(BASE_DIR, 'media/', JOB_ID, 'upload/dataset/', data)
        df = pd.read_csv(path, comment='#')
        df['Site'] = 1

        # filter groups
        group = []
        for g in groups:
            path = os.path.join(BASE_DIR, 'media/', JOB_ID, 'upload/group/', g['name'])
            with open(path, 'r') as f:
                group += f.read().splitlines()
        if group != []:
            df = df[ df['ref_id'].isin(group) ].reset_index(drop=True)

        if set(['CIGAR','MD']).issubset(df.columns):
            df = df[['ref_id','read_count','Site','CIGAR','MD']]
            '''
            df['Mismatch Site'] = 0
            # deletion, insertion, clip, mismatch
            df.loc[df['CIGAR'].str.contains('D|I|S|H|X',regex=True), 'Mismatch Site'] = 1
            # mismatch
            df.loc[df['Mismatch Site']==0, 'Mismatch Site'] = df['MD'].apply(lambda x: len(re.findall(r'[A-Z]',str(x)))!=0).astype(int)
            '''
            del df['CIGAR']
            del df['MD']
        else:
            df = df[['ref_id','read_count','Site']]
        df = df.groupby('ref_id').sum().reset_index()
        return df

    config = json.loads(request.POST['config'])
    df = _read_dataset(config['data'][0]['name'], config['group'])

    # paired-data
    if len(config['data']) > 1:
        df_MUT = _read_dataset(config['data'][1]['name'], config['group'])
        
        # find intersection and merge two columns
        columns = list(set(df.columns) & set(df_MUT.columns))
        df = pd.merge(df_MUT, df, on='ref_id')
        for col in columns:
            if col=='ref_id':
                continue
            elif col=='read_count':
                df['read_count_x'] = df['read_count_x'] + pow(10,-6)
                df['read_count_y'] = df['read_count_y'] + pow(10,-6)
                df[col] = df['read_count_x'] / df['read_count_y']
                
                # add p-value
                BCV = 0.1
                compare = ['read_count_x','read_count_y']
                pvalue_df = df[['ref_id']+compare].set_index('ref_id')
                pvalue_df = add_pvalue(pvalue_df, compare, BCV)[['PValue']]
                pvalue_df = pvalue_df.rename(columns={'PValue':'p-value'})
                df = pd.merge(df, pvalue_df, on='ref_id', how='left')
            else:
                df[col] = df[col+'_x'].astype(str) + ' / ' + df[col+'_y'].astype(str)
                df.drop(columns=[col+'_x', col+'_y'], inplace=True)  
        df = df[columns+['p-value']]

    # paired-data       
    df = df.rename(columns={'read_count': 'Read Count'})
    if len(config['data']) > 1:   
        df = df.add_suffix(' (Mut/WT)')
        df = df.rename(columns={
            'ref_id (Mut/WT)': 'ref_id',
            'p-value (Mut/WT)': 'p-value',
        })
    
    # save reference
    dirs = [
        os.path.join(BASE_DIR, 'media/', JOB_ID, 'reference'),
        os.path.join(BASE_DIR, 'media/', JOB_ID, 'reference/browser'),
    ]
    for dir in dirs: 
        if not os.path.isdir(dir):
            os.mkdir(dir)
    for i in ['1','2']:   
        if 'reference'+i in request.FILES:
            file = request.FILES['reference'+i]
            path = JOB_ID + '/reference/browser/' + file.name
            if os.path.exists(BASE_DIR+'/media/'+path):
                os.remove(BASE_DIR+'/media/'+path)
            file_name = default_storage.save(path, file)

    # add annotations
    if 'reference1' in config:
        path = os.path.join(dirs[1], config['reference1'])
        if path.endswith('.csv'):
            df_ref = pd.read_csv(path)
        else:
            df_ref = read_fasta(path)
        if 'ref_seq' in df_ref:
            del df_ref['ref_seq']
        df = pd.merge(df, df_ref, on='ref_id')
    df = df.rename(columns={'ref_id': 'Reference ID'})

    path = os.path.join(BASE_DIR, 'media/', JOB_ID, 'transcript.csv')
    df.to_csv(path, index=False)

    # save config
    path = os.path.join(BASE_DIR, 'media/', JOB_ID, 'plot_config.yml')
    if os.path.exists(path):
        plot_config = read_config(path)   
    else:
        plot_config = {}
    plot_config['Browser'] = {
        'data': [], 'group': [], 'filter': []
    }
    plot_config['Browser']['data'] = config['data']
    plot_config['Browser']['group'] = config['group']
    plot_config['Browser']['filter'] = config['group']
    if 'reference1' in config:
        plot_config['Browser']['reference1'] = config['reference1']
    if 'reference2' in config:
        plot_config['Browser']['reference2'] = config['reference2']
    with open(path, 'w') as f:
        yaml.dump(plot_config, f, default_flow_style=False)
    
    # save data config
    if 'data' in request.POST:
        config = json.loads(request.POST['data'])
        path = os.path.join(BASE_DIR, 'media/', JOB_ID, 'data.yml')
        with open(path, 'w') as f:
            yaml.dump(config, f, default_flow_style=False)
    
    return 0

# generate site table
def get_site(name, JOB_ID):

    def _extract_sequence(row):
        return row['ref_seq'][row['init_pos']-1:row['end_pos']]

    def _detect_mutation(row):
        read_seq = ''
        ref_seq = ''
        read_init = 0
        ref_init = 0
        for CIGAR in row['CIGAR_lst']:
            symbol = CIGAR[-1]
            length = int(CIGAR[:-1])
            read_end = read_init
            ref_end = ref_init
            
            # match or mismatch
            if symbol=='M':
                read_end = read_init + length
                ref_end = ref_init + length
                for i in range(length):
                    if row['read_seq'][read_init+i]==row['ref_seq'][ref_init+i]:
                            read_seq += row['read_seq'][read_init+i]
                    else:
                        read_seq += "<span class='M'>{}</span>".format(row['read_seq'][read_init+i])
                ref_seq += row['ref_seq'][ref_init:ref_end]
                  
            # deletion
            elif symbol=='D':
                ref_end = ref_init + length
                read_seq += "<span class='D'>{}</span>".format('-'*length)
                ref_seq += row['ref_seq'][ref_init:ref_end]
                
            # insertion
            elif symbol=='I':
                read_end = read_init + length
                read_seq += "<span class='I'>{}</span>".format(row['read_seq'][read_init:read_end])
                ref_seq += '-' * length
                
            # soft-clipped
            elif symbol=='S':
                read_end = read_init + length
                read_seq += "<span class='S'>{}</span>".format(row['read_seq'][read_init:read_end])
                ref_seq += '*' * length
                
            # hard-clipped
            elif symbol=='H':
                read_seq += "<span class='H'>{}</span>".format('*'*length)
                ref_seq += '*' * length
            
            # equal
            elif symbol=='=':
                read_end = read_init + length
                ref_end = ref_init + length
                read_seq += row['read_seq'][read_init:read_end]
                ref_seq += row['ref_seq'][ref_init:ref_end]
            
            # not equal
            elif symbol=='X':
                read_end = read_init + length
                ref_end = ref_init + length
                read_seq += "<span class='M'>{}</span>".format(row['read_seq'][read_init:read_end])
                ref_seq += row['ref_seq'][ref_init:ref_end]
            
            read_init = read_end
            ref_init = ref_end
        return pd.Series([read_seq, ref_seq])

    def _map(seq):
        dic = {
            # CIGAR: M,D,I,S,H,=,X
            # nucleotide:
            'T':'A', 'A':'U', 'U':'A', 'C':'G', 'G':'C',
        }
        def _dict(nt):
            if nt in dic: return dic[nt]
            else: return nt
        seq = ''.join(_dict(nt) for nt in seq)
        return seq

    def _read_dataset(data, name, df_ref=None):
        
        path = os.path.join(BASE_DIR, 'media/', JOB_ID, 'upload/dataset/', data)
        #df = pd.read_csv(path, comment='#')
        cmt = ""
        with open(path, 'r') as f:
            for line in f:
                if line[0]=='#': cmt += line   
                else: break
            header = line[:-1].split(',')
            df = pd.read_csv(f, comment='#', names=header)
        df = df[df['ref_id']==name]
        df['read_count'] = df['read_count'].round(3)
        df['Position'] = df['init_pos'].astype(str) + '-' + df['end_pos'].astype(str)
        if df_ref is not None:
            df = pd.merge(df, df_ref, on='ref_id', how='left')
            if 'ref_seq' in df.columns:
                df['ref_seq'] = df.apply(_extract_sequence, axis=1)
            
        # add mutation information on the sequence
        if set(['CIGAR','read_seq','ref_seq']).issubset(df.columns):
            df['CIGAR_lst'] = df['CIGAR'].apply(lambda x: re.findall(r'[0-9]+[A-Z]',x))
            df[['read_seq','ref_seq']] = df.apply(_detect_mutation, axis=1)
            del df['CIGAR_lst']
        if 'ref_seq' in df.columns:
            df['ref_seq'] = df['ref_seq'].str.replace('T','U')
        if 'read_seq' in df.columns:
            if 'strand' in df:
                df.loc[df['strand']=='+', 'read_seq'] = df['read_seq'].str.replace('T','U')
                df.loc[df['strand']=='-', 'read_seq'] = df['read_seq'].apply(lambda x: _map(x))
            elif "# add_reverse_complement" in cmt:
                df['strand'] = '-'
                df.loc[:, 'read_seq'] = df['read_seq'].apply(lambda x: _map(x))
            else:
                df['strand'] = '+'
                df['read_seq'] = df['read_seq'].str.replace('T','U')
        
        # calculate the y-axis height of every site
        df = df.sort_values(by=['init_pos', 'end_pos']).reset_index(drop=True)
        df['site_height'] = 0
        df['height_test'] = False
        height = 0
        k = 0
        df.loc[k, 'site_height'] = height
        df.loc[k, 'height_test'] = True
        while False in df['height_test'].values:
            try:
                index = df[(df['init_pos']>df.loc[k, 'end_pos'])&(df['height_test']==False)].sort_values(by=['init_pos']).index[0]
            except:
                index = k + 1
                height = height + 1
            df.loc[index, 'site_height'] = height
            df.loc[index, 'height_test'] = True
            k = index
            while len(df[(df['init_pos']>df.loc[k, 'end_pos'])&(df['height_test']==False)]) == 0:
                height += 1
                if len(df[df['height_test']==False]) != 0:
                    k = df[(df['height_test']==False)].sort_values(by=['init_pos']).index[0]
                    df.loc[k, 'site_height'] = height
                    df.loc[k, 'height_test'] = True
                else:
                    break

        # rename columns
        columns = {
            'read_id': 'Read ID',
            'ref_id': 'Reference ID',
            'read_count': 'Read Count',
            'strand': 'Strand',
        }
        if 'read_seq' in df.columns:
            columns['read_seq'] = 'Read Sequence'
        if 'ref_seq' in df.columns:
            columns['ref_seq'] = 'Reference Sequence'
        if 'score' in df.columns:
            columns['score'] = 'Score'
        df = df.rename(columns=columns)
        
        # delete columns
        if 'CIGAR' in df.columns: del df['CIGAR']
        if 'MD' in df.columns: del df['MD']
        del df['init_pos']
        del df['end_pos']
        del df['height_test']
        
        return df

    path = os.path.join(BASE_DIR, 'media/', JOB_ID, 'plot_config.yml')
    config = read_config(path)['Browser']

    # read sequence reference
    df_ref = None
    if 'reference1' in config:
        path = os.path.join(BASE_DIR, 'media/', JOB_ID, 'reference/browser', config['reference1'])
        if path.endswith('.csv'):
            df_ref = pd.read_csv(path)
        else:
            df_ref = read_fasta(path)
        if set(['ref_id','ref_seq']).issubset(df_ref.columns):
            df_ref = df_ref[['ref_id','ref_seq']]
        else:
            df_ref = None

    # read dataset
    df = _read_dataset(config['data'][0]['name'], name, df_ref)
    site_table = [json.loads(json.dumps(df.to_dict(orient='records')))]
    
    # paired-data
    if len(config['data']) > 1:
        df_MUT = _read_dataset(config['data'][1]['name'], name, df_ref)
        site_table.append(json.loads(json.dumps(df_MUT.to_dict(orient='records'))))

    # Region table
    path = os.path.join(BASE_DIR, 'media/', JOB_ID, 'reference/browser/')
    if ('reference2' in config) and (os.path.exists(path + config['reference2'])):
        df_region = pd.read_csv(path + config['reference2'])
        df_region = df_region[df_region['ref_id']==name]
        df_region['length'] = df_region['end_pos'] - df_region['init_pos'] + 1
        del df_region['ref_id']
    else:
        df_ref = df_ref[df_ref['ref_id']==name]
        end = len(df_ref['ref_seq'].iloc[0])
        data = {'region': ['ALL'], 'init_pos': [1], 'end_pos':[end], 'length':[end]}
        df_region = pd.DataFrame(data)
    region_table = json.loads(json.dumps(df_region.to_dict(orient='records')))

    return {
        'site_table': site_table,
        'region_table': region_table,
    }
