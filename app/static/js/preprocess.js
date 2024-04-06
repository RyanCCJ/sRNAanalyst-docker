/* Preprocess */

function workflow(config = null) {
    if (config) {
        // load file
        let file = config['input_file'].split('/').slice(-1);
        $(`#workflow #input`).hide();
        $(`#workflow #input-current`).show();
        $(`#workflow #input-current span`).hide();
        $(`#workflow #input-current i`).show();
        $(`#workflow #input-current #text`).text(`Current File: ${file}`);

        // load config
        trimming(config);
        normalization(config);
        mapping(config);
    }
    else {
        let trimming_config, normalization_config, mapping_config, data, input_file, config;

        input_file = $('#workflow #input-current').parent().find('#text').text().substring(14);
        data = input_file;
        for (const ex of ['.zip', '.gz', '.fq', '.fastq']) {
            if (data.slice(-ex.length) == ex) {
                data = data.slice(0, -ex.length);
            }
        }

        trimming_config = trimming();
        normalization_config = normalization();
        mapping_config = mapping();

        config = {
            data: data,
            input_file: input_file,
            trimming: trimming_config,
            normalization: normalization_config,
            mapping: mapping_config,
        }
        return config
    }
}

function trimming(config = null) {
    if (config) {
        $(`#trimming #active`).prop("checked", config['trimming']['active']).trigger('change');
        $(`#trimming #tool option[value="${config['trimming']['tool']}"]`).prop('selected', true);
        for (const field of ['score3', 'score5', 'adapter3', 'adapter5', 'UMI3', 'UMI5', 'max_length', 'min_length', 'max_n', 'extra_args']) {
            $(`#trimming #${field}`).val(config['trimming'][field]);
        }
    }
    else {
        let config, active, tool, score3, score5, adapter3, adapter5, UMI3, UMI5, max_length, min_length, max_n, extra_args;

        active = $('#workflow #trimming #active').prop('checked') ? true : false;
        tool = $('#workflow #trimming #tool :selected').val();
        score3 = $('#workflow #trimming #score3').val();
        score5 = $('#workflow #trimming #score5').val();
        adapter3 = $('#workflow #trimming #adapter3').val();
        adapter5 = $('#workflow #trimming #adapter5').val();
        UMI3 = $('#workflow #trimming #UMI3').val();
        UMI5 = $('#workflow #trimming #UMI5').val();
        max_length = $('#workflow #trimming #max_length').val();
        min_length = $('#workflow #trimming #min_length').val();
        max_n = $('#workflow #trimming #max_n').val();
        extra_args = $('#workflow #trimming #extra_args').val();

        config = {
            active: active,
            tool: tool,
            score3: score3,
            score5: score5,
            adapter3: adapter3,
            adapter5: adapter5,
            UMI3: UMI3,
            UMI5: UMI5,
            max_length: max_length,
            min_length: min_length,
            max_n: max_n,
            extra_args: extra_args,
        }
        return config
    }
}

function normalization(config = null) {
    if (config) {
        $(`#normalization #active`).prop("checked", config['normalization']['active']).trigger('change');
        $(`#normalization #strategy option[value="${config['normalization']['strategy']}"]`).prop('selected', true).trigger('change');
        if ('reference' in config['normalization']) {
            $('#normalization #reference-text').text(config['normalization']['reference'].split('/').slice(-1));
        } else {
            $('#normalization #reference-text').text('No file chosen');
        }
        for (const field of ['tool', 'strand','search', 'efficiency', 'boundary']) {
            $(`#normalization #${field} option[value="${config['normalization'][field]}"]`).prop('selected', true);
        }
        for (const field of ['factor', 'number', 'extra_args']) {
            $(`#normalization #${field}`).val(config['normalization'][field]);
        }
    }
    else {
        let config, active, strategy, factor, tool, strand, search, number, efficiency, boundary, extra_args;

        active = $('#workflow #normalization #active').prop('checked') ? true : false;
        strategy = $('#workflow #normalization #strategy :selected').val();
        factor = $('#workflow #normalization #factor').val();
        tool = $('#workflow #normalization #tool :selected').val();
        strand = $('#workflow #normalization #strand :selected').val();
        search = $('#workflow #normalization #search :selected').val();
        number = $('#workflow #normalization #number').val();
        efficiency = $('#workflow #normalization #efficiency :selected').val();
        boundary = $('#workflow #normalization #boundary :selected').val();
        extra_args = $('#workflow #normalization #extra_args').val();

        config = {
            active: active,
            strategy: strategy,
            factor: factor,
            tool: tool,
            strand: strand,
            search: search,
            number: number,
            efficiency: efficiency,
            boundary: boundary,
            extra_args: extra_args,
        }
        return config
    }
}

function mapping(config = null) {
    if (config) {
        $('#mapping #active').prop("checked", config['mapping']['active']).trigger('change');
        if ('reference' in config['mapping']) {
            $('#mapping #reference-text').text(config['mapping']['reference'].split('/').slice(-1));
        } else {
            $('#mapping #reference-text').text('No file chosen');
        }
        for (const field of ['tool', 'strand','search', 'efficiency', 'boundary']) {
            $(`#mapping #${field} option[value="${config['mapping'][field]}"]`).prop('selected', true);
        }
        for (const field of ['number', 'extra_args']) {
            $(`#mapping #${field}`).val(config['mapping'][field]);
        }
        if (config['mapping']['filter']!='') {
            $(`#mapping #filter option[value="yes"]`).prop('selected', true).trigger('change');
            let head = config['mapping']['filter'].split(':')[0];
            let length = config['mapping']['filter'].split(':')[1];
            let tail= config['mapping']['filter'].split(':')[2];
            if (head.length > 0) {
                for (const i of ['A','U','C','G']) {
                    $(`#mapping #head_${i}`).prop("checked", false);
                }    
                for (let i=0; i<head.length; i++) {
                    $(`#mapping #head_${head.charAt(i)}`).prop("checked", true);
                }
            }
            if (tail.length > 0) {
                for (const i of ['A','U','C','G']) {
                    $(`#mapping #tail_${i}`).prop("checked", false);
                }    
                for (let i=0; i<tail.length; i++) {
                    $(`#mapping #tail_${head.charAt(i)}`).prop("checked", true);
                }
            }
            $('#mapping #length').val(length);
        }
    }
    else {
        let config, active, filter, length, tool, strand, search, number, efficiency, boundary, extra_args;

        active = $('#workflow #mapping #active').prop('checked') ? true : false;
        length = $('#workflow #mapping #length').val();
        tool = $('#workflow #mapping #tool :selected').val();
        strand = $('#workflow #mapping #strand :selected').val();
        search = $('#workflow #mapping #search :selected').val();
        number = $('#workflow #mapping #number').val();
        efficiency = $('#workflow #mapping #efficiency :selected').val();
        boundary = $('#workflow #mapping #boundary :selected').val();
        extra_args = $('#workflow #mapping #extra_args').val();

        if ($('#workflow #mapping #show_filter').is(":visible")) {
            let filter_dict = { 'head': '', 'tail': '' };
            for (const pos in filter_dict) {
                for (const nt of ['A', 'U', 'C', 'G']) {
                    if ($(`#workflow #mapping #${pos}_${nt}`).prop("checked"))
                        filter_dict[pos] += nt;
                }
                if (filter_dict[pos] == 'AUCG')
                    filter_dict[pos] = '';
            }
            filter = filter_dict['head'] + ':' + length + ':' + filter_dict['tail'];
        } else {
            filter = '';
        }

        config = {
            active: active,
            filter: filter,
            tool: tool,
            strand: strand,
            search: search,
            number: number,
            efficiency: efficiency,
            boundary: boundary,
            extra_args: extra_args,
        }
        return config
    }
}

function utility(config = null) {
    if (config) {

        // load file
        let file = config['input_file'].split('/').slice(-1);
        $(`#utility #input`).hide();
        $(`#utility #input-current`).show();
        $(`#utility #input-current span`).hide();
        $(`#utility #input-current i`).show();
        $(`#utility #input-current #text`).text(`Current File: ${file}`);

        // load config
        for (const field of ['field', 'read', 'map', 'filter']) {
            if (config[field] != '')
                $(`#utility #${field}_check`).prop("checked", true).trigger('change');
            else
                $(`#utility #${field}_check`).prop("checked", false).trigger('change');
        }
        for (const field of ['merge', 'normalize']) {
            if (config[field] != '')
                $(`#utility #${field}_field_check`).prop("checked", true).trigger('change');
            else
                $(`#utility #${field}_field_check`).prop("checked", false).trigger('change');
        }
        for (const field of ['strand', 'format', 'read', 'normalize', 'from', 'to']) {
            $(`#utility #${field} option[value="${config[field]}"]`).prop('selected', true);
        }
        for (const field of ['factor', 'length', 'merge', 'field']) {
            $(`#utility #${field}`).val(config[field]);
        }
        let head = config['map'].split(':')[0];
        let tail = config['map'].split(':')[1];
        $(`#utility #head_${head}`).prop("checked", true);
        $(`#utility #tail_${tail}`).prop("checked", true);
        if (config['filter']!='') {
            let head = config['filter'].split(':')[0];
            let length = config['filter'].split(':')[1];
            let tail= config['filter'].split(':')[2];
            if (head.length > 0) {
                for (const i of ['A','U','C','G']) {
                    $(`#utility #head_${i}`).prop("checked", false);
                }    
                for (let i=0; i<head.length; i++) {
                    $(`#utility #head_${head.charAt(i)}`).prop("checked", true);
                }
            }
            if (tail.length > 0) {
                for (const i of ['A','U','C','G']) {
                    $(`#utility #tail_${i}`).prop("checked", false);
                }    
                for (let i=0; i<tail.length; i++) {
                    $(`#utility #tail_${head.charAt(i)}`).prop("checked", true);
                }
            }
            $('#utility #length').val(length);
        }
        $(`#utility #rc`).prop("checked", config['rc']);
        $('#utility #reference-text').text(config['reference'].split('/').slice(-1));
    }
    else {
        let config, data, input_file, strand, format, length, field, read, rc, map, filter, reference, merge, normalize, factor;

        factor = $('#utility #factor').val();
        length = $('#utility #length').val();
        merge = $('#utility #merge').val();
        strand = $('#utility #strand :selected').val();
        format = $('#utility #format :selected').val();
        field = $('#utility #field_check').prop('checked') ? $('#utility #field').val() : '';
        read = $('#utility #read_check').prop('checked') ? $('#utility #read :selected').val() : '';
        normalize = $('#utility #normalize_field_check').prop('checked') ? $('#utility #normalize :selected').val() : '';
        reference = ($('#utility #reference').val() != '') ? $('#utility #reference').prop('files')[0].name : '';
        rc = $('#utility #rc').prop('checked') ? true : false;

        if ($(`#utility #input-current #text`).text() != '') {
            input_file = $(`#utility #input-current #text`).text().slice(14);
            console.log(input_file);
            data = input_file.split('.')[0];
        }
        if ($('#utility #map_check').prop('checked')) {
            map = $('#utility #from :selected').val() + ':' + $('#utility #to :selected').val();
        } else {
            map = '';
        }
        if ($('#utility #filter_check').prop('checked')) {
            let filter_dict = { 'head': '', 'tail': '' };
            for (const pos in filter_dict) {
                for (const nt of ['A', 'U', 'C', 'G']) {
                    if ($(`#utility #${pos}_${nt}`).prop("checked"))
                        filter_dict[pos] += nt;
                }
                if (filter_dict[pos] == 'AUCG')
                    filter_dict[pos] = '';
            }
            filter = filter_dict['head'] + ':' + length + ':' + filter_dict['tail'];
        } else {
            filter = '';
        }

        config = {
            data: data,
            input_file: input_file,
            strand: strand,
            format: format,
            field: field,
            read: read,
            rc: rc,
            map: map,
            filter: filter,
            reference: reference,
            merge: merge,
            normalize: normalize,
            factor: factor,
        }
        return config
    }
}
