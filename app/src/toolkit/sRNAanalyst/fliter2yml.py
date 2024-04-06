import argparse
import os
import yaml

def to_config_gene(gene_dir, config_file, save=False):
    
    data = {}
    data['gene_path'] = gene_dir
    gene_lst = os.listdir(gene_dir)
    gene_lst = sorted(gene_lst)
    gene_lst.insert(0,'all mRNAs')
    gene_dic = [{'name': gene, 'path': '../data/C.elegans/transcripts/'+gene} for gene in gene_lst ]

    if save:
        with open(config_file, 'w') as f:
            data['filter'] = gene_dic
            yaml.dump(data, f, default_flow_style=False)
    
    return data

if __name__ == '__main__':

    parser = argparse.ArgumentParser(
        description="This is a tool to write gene list into config file.",
    )
    parser.add_argument("path_1", help="gene-list directory")
    parser.add_argument("path_2", help="config file (YAML)")
    args = parser.parse_args()
    
    to_config_gene(args.path_1, args.path_2, save=True)
