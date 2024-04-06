/* Preprocess & Analysis tool settings */

const tools = {
    // type: [tool_1, tool_2, ...]
    'preprocess': ['workflow', 'utility'],
    'analysis': ['browser','density', 'metagene', 'boundary', 'codon', 'fold', 'scatter'],
};

let time = {
    'browser': 0,
    'density': 0,
    'metagene': 0,
    'boundary': 0,
    'codon': 0,
    'fold': 0,
    'scatter': 0,
    'workflow': 0,
    'utility': 0,
};

function change_button(tool) {
    if (time[tool] >= 0) {
        $(`#${tool} #loading_time`).html(`Loading... Please wait ${time[tool]}s`);
        time[tool] += 1;
        setTimeout(change_button, 1000, tool);
    }
}

function get_config(tool, config=null) {
    // preprocess
    if (tool == 'workflow') return workflow(config);
    else if (tool == 'utility') return utility(config);
    // analysis
    else if (tool == 'browser') return browser(config);
    else if (tool == 'density') return density(config);
    else if (tool == 'metagene') return metagene(config);
    else if (tool == 'boundary') return position(tool, config);
    else if (tool == 'codon') return position(tool, config);
    else if (tool == 'fold') return fold(config);
    else if (tool == 'scatter') return scatter(config); 
}

function load_data(tool, config) {

    // load data
    let data_text = '';
    if (tool=='fold' || tool=='scatter') {
        for (const d of config['data']) {
            let control = d['name'].split('\n')[1];
            let mutant = d['name'].split('\n')[0];
            data_text += `<a href="/sRNAanalyst_media/${JOB_ID['analysis']}/upload/dataset/${control}" download="">${control}</a>` +', ';
            data_text += `<a href="/sRNAanalyst_media/${JOB_ID['analysis']}/upload/dataset/${mutant}" download="">${mutant}</a>` +', ';
        }
    }
    else {
        for (const d of config['data']) {
            data_text += `<a href="/sRNAanalyst_media/${JOB_ID['analysis']}/upload/dataset/${d['name']}" download="">${d['name']}</a>` +', ';
        }
    }
    data_text = data_text.slice(0, -2);
    $(`#${tool} #target_data`).html(data_text);

    // load group
    let group_text = '';
    if (config['filter'].length > 0) {
        for (const f of config['filter']) {
            group_text += `<a href="/sRNAanalyst_media/${JOB_ID['analysis']}/upload/group/${f['name']}" download="">${f['name']}</a>` +', ';
        }
        group_text = group_text.slice(0, -2);    
    } else {
        group_text = "All Target RNA";
    }
    $(`#${tool} #target_list`).html(group_text);
    $(`#${tool} #target_list_div`).show();
}

function load_id(type, id) {

    $(`#overview-${type.slice(0, 3)} .submit span`).show();
    $(`#overview-${type.slice(0, 3)} .submit i`).hide();
    $(`#overview-${type.slice(0, 3)} .submit`).prop('disabled', true);

    axios.get(`/sRNAanalyst/id/${id}/${type}/all`)
        .then(res => {
            $(`#overview-${type.slice(0, 3)} #show-id`).text(id);
            JOB_ID[type] = id;
            let tmp = "";
            for (const tool of tools[type]) {
                if (tool=='browser') {
                    if (Object.keys(res.data[tool]).length > 0) {
                        table_data = res.data[tool]['config'];
                        get_config(tool, res.data[tool]['config']);
                        print_table('#browser #ref_table', res.data[tool]['table']);
                        tmp += (tool + ', ');
                    }  
                } else {
                    if (res.data[tool]['csv_path'].length != 0) {
                        get_config(tool, res.data[tool]['config']);
                        show_result(tool, res.data[tool], JOB_ID[type]);
                        tmp += (tool + ', ');
                    }
                }
            }
            if ('data' in res.data && Object.keys(res.data['data']).length > 0) {
                data = res.data['data']['data'];
                group = res.data['data']['group'];
                refresh_data(true);
                if (group.length == 0)
                    $('#group #default').removeClass('text-danger').addClass('text-success').text('(enabled)');
                else {
                    $('#group #default').removeClass('text-success').addClass('text-danger').text('(disabled)');
                    let max_index = 0;
                    for (const group_item of group) {
                        group_config_num = group_item['index'] - 1;
                        max_index = (max_index<group_config_num)? group_config_num:max_index;
                        add_group('#group #new-group-block', group_item['name'], check=true);
                    } 
                    group_config_num = max_index + 1; 
                }
            }
            if (tmp.length == 0) {
                $('#message .toast-body').text(`No results yet.`)
                $('#message').toast('show');
            } else {
                $('#message .toast-body').text(`Success load results: ${tmp.slice(0, -2)}`)
                $('#message').toast('show');
            }
            $(`#overview-${type.slice(0, 3)} .submit span`).hide();
            $(`#overview-${type.slice(0, 3)} .submit i`).show();
            $(`#overview-${type.slice(0, 3)} .submit`).prop('disabled', false);
        })
        .catch(err => {
            console.log(err);
            if ('response' in err && err.response.status != 500) {
                $(`#overview-${type.slice(0, 3)} #id`)[0].setCustomValidity(err.response.data);
                $(`#overview-${type.slice(0, 3)} #id`)[0].reportValidity();
            }
            $(`#overview-${type.slice(0, 3)} .submit span`).hide();
            $(`#overview-${type.slice(0, 3)} .submit i`).show();
            $(`#overview-${type.slice(0, 3)} .submit`).prop('disabled', false);
        });
}

function show_result(tool, response, id) {
    $(`#result_${tool}`).show();

    if (tool == 'workflow') {

        // show links
        $(`#${tool} #link_block`).hide();
        let link_path = response.link_path;
        if (link_path.length > 0) {
            $(`#${tool} #link_block`).html('<div class="row"><b class="col-12">Show Fastqc Results (berfore & after trimming)</b></div>');
            for (let i = 0; i < link_path.length; i++) {
                let link_file = link_path[i].split('/').pop();
                $(`#${tool} #link_block`).append(`
                <a class="me-2" href="${link_path[i]}?timestamp=${new Date().getTime()}" target="_blank">
                <small>${link_file} <i class="bi bi-box-arrow-up-right"></i></small>
                </a>
            `);
            }
            $(`#${tool} #link_block`).show();
        }

        // show normalization factor
        $(`#${tool} #factor_block`).hide();
        let norm_facotr = response.norm_facotr;
        if (norm_facotr) {
            $(`#${tool} #factor_block`).html('<div class="row"><b class="col-12">Normalization Factor</b></div>');
            $(`#${tool} #factor_block`).append(`<small class="me-2 basic-color"">${norm_facotr}</small>`);
            $(`#${tool} #factor_block`).show();
        }

        // show mapping results
        $(`#${tool} #log_block`).hide();
        let log = response.log;
        if (log) {
            log = log.replace(/\n/g, '<br>');
            $(`#${tool} #log_block`).html('<div class="row"><b class="col-12">Mapping Results</b></div>');
            $(`#${tool} #log_block`).append(`<small class="me-2">${log}</small>`);
            $(`#${tool} #log_block`).show();
        }
    }

    // update files
    let csv_path = response.csv_path;
    $(`#${tool} #file_block`).html('<div class="row"><b class="col-12">Download Files</b></div>');
    for (let i = 0; i < csv_path.length; i++) {
        $(`#${tool} #file_block`).append(`
        <a href="/sRNAanalyst_media/${id}/${csv_path[i]}" class="btn btn-sm btn-outline-secondary mb-2" download>
        ${csv_path[i]} <i class="bi bi-download"></i>
        </a>
    `);
    }
    $(`#${tool} #file_block`).show();

    // update images
    let img_path = response.img_path;
    $(`#${tool} #img_block img`).remove();
    //let width = (img_path.length>1)? '6':'12';
    let width = '';
    if (tool == 'metagene' || tool == 'boundary' || tool == 'codon') {
        width = (img_path.length > 1) ? '6' : '12';
    } else {
        width = '12';
    }
    for (let j = 0; j < img_path.length; j++) {
        $(`#${tool} #img_block`).append(`
        <img class="img-fluid img-thumbnail mt-2 col-${width}" src="${img_path[j]}?timestamp=${new Date().getTime()}">
    `);
    }
    $(`#${tool} #img_block`).show();
}

function submit(type, tool) {

    $(`#sidebar #sidebar_${tool}`).find('.bi').hide();
    $(`#sidebar #sidebar_${tool} .spinner-grow`).show();
    $(`#submit_${tool}`).hide();
    $(`#submit_loading_${tool}`).show();
    $(`#result_${tool}`).hide();
    time[tool] = 0;
    change_button(tool);

    let form_data = new FormData();
    let config = get_config(tool);

    // add data info
    if (type=='analysis') {
        let data_config = JSON.stringify({ data:data, group:group })
        form_data.append('data', data_config); 
    }
    if (tool=='browser') {
        $('#browser #detail_browser').hide();
    }

    // add reference files
    if (tool == 'workflow') {
        if ($(`#workflow #normalization #active`).prop('checked') &&
            $('#workflow #normalization #strategy :selected').val()=='Abundance') {
            if ($('#workflow #normalization #reference-text').text() != 'No file chosen') {
                config['normalization']['reference'] = $('#workflow #normalization #reference-text').text();
            }
            let target = $('#workflow #normalization #reference');
            if (target.prop('files').length > 0) {
                form_data.append('reference_nor', target.prop('files')[0]);   
            }
        }
        if ($(`#workflow #mapping #active`).prop('checked')) {
            if ($('#workflow #mapping #reference-text').text() != 'No file chosen') {
                config['mapping']['reference'] = $('#workflow #mapping #reference-text').text();
            }
            let target = $('#workflow #mapping #reference');
            if (target.prop('files').length > 0) {
                form_data.append('reference_map', target.prop('files')[0]);   
            }
        }
    }
    else if (tool == 'utility') {
        if ($(`#utility #reference-text`).text() != 'No file chosen') {
            config['reference'] = $('#utility #reference-text').text();
        }
        let target = $('#utility #reference');
        if (target.prop('files').length > 0) {
            form_data.append('reference', target.prop('files')[0]);   
        }
    }
    else if (tool == 'browser') {
        for (const i of ['1','2']) {
            if ($(`#browser #reference-text${i}`).text() != 'No file chosen') {
                config[`reference${i}`] = $(`#browser #reference-text${i}`).text();
            }
            let target = $(`#browser #reference${i}`);
            if (target.prop('files').length > 0) {
                form_data.append(`reference${i}`, target.prop('files')[0]);   
            }
        }
    }
    else {
        if ($(`#${tool} #reference-text`).text() != 'No file chosen') {
            config['run_config']['reference'] = $(`#${tool} #reference-text`).text();
        }
        let target = $(`#${tool} #reference`);
        if (target.prop('files').length > 0) {
            form_data.append('reference', target.prop('files')[0]);   
        }
    }
    form_data.append('config', JSON.stringify(config));
    console.log(config);

    let url = `/sRNAanalyst/id/${JOB_ID[type]}/${type}/${tool}`;
    axios.post(url, form_data, axios_config)
        .then(res => {
            axios.get(url).then(res => {
                $(`#sidebar #sidebar_${tool} .bi-check-circle`).show();
                $(`#sidebar #sidebar_${tool} .spinner-grow`).hide();
                $(`#submit_${tool}`).show();
                $(`#submit_loading_${tool}`).hide();
                get_config(tool, res.data['config']);
                if (tool=='browser') {
                    table_data = res.data['config'];
                    print_table('#browser #ref_table', res.data.table);
                } else {
                    show_result(tool, res.data, JOB_ID[type]);
                }
                console.log('running time: ' + time[tool] + 's');
                time[tool] = -1;

            }).catch(err => {
                console.log(err);
                alert("Something Wrong! Please verify that all input formats are correct. \nIf the input format is confirmed to be correct and the issue persists, please try reloading the page.");
                $(`#sidebar #sidebar_${tool} .bi-circle`).show();
                $(`#sidebar #sidebar_${tool} .spinner-grow`).hide();
                $(`#submit_${tool}`).show();
                $(`#submit_loading_${tool}`).hide();
                $(`#result_${tool}`).hide();
                time[tool] = -2;
            });
        })
        .catch(err => {
            console.log(err);
            err_msg = "Something Wrong! Please verify that all input formats are correct. If there are any issues, please contact us for more detail.";
            if (err.response) {
                if (err.response.status == 504) {
                    // 504 Gateway timeout
                    alert("Server timeout! Please reload and check if your data is ready.");
                }
                else if (err.response.status == 406) {
                    // 406 Not Acceptable
                    alert("Input parameters cannot contain illegal characters.");
                }
                else alert(err_msg);
            }
            else {
                alert(err_msg);
            }
            $(`#sidebar #sidebar_${tool} .bi-circle`).show();
            $(`#sidebar #sidebar_${tool} .spinner-grow`).hide();
            $(`#submit_${tool}`).show();
            $(`#submit_loading_${tool}`).hide();
            $(`#result_${tool}`).hide();
            time[tool] = -2;
        });
}

/* Main */
$(document).ready(function () {

    // default settings
    $('#metagene, #boundary, #codon, #scatter').find('#color').val('deep');
    $('#density, #metagene, #boundary, #codon').find('.condition4').addClass('single-condition4');
    $('#fold, #scatter').find('#scale').val('log2');
    $('#fold, #scatter').find('.condition4').addClass('paired-condition4');

    // load job ID or example
    for (const type in tools) {
        const target = $(`#overview-${type.slice(0, 3)} #id`);
        $(`#overview-${type.slice(0, 3)} .submit`).on('click', function () {
            if (target[0].checkValidity()) {
                load_id(type, target.val());
            } else {
                target[0].setCustomValidity("");
                target[0].reportValidity();
            }
        });
        $(`#overview-${type.slice(0, 3)} #load-example`).on('click', function () {
            $(`#overview-${type.slice(0, 3)} .submit span`).show();
            $(`#overview-${type.slice(0, 3)} .submit i`).hide();
            $(`#overview-${type.slice(0, 3)} .submit`).prop('disabled', true);
            url = `/sRNAanalyst/id/${JOB_ID[type]}/${type}/example`;
            form_data = new FormData();
            axios.post(url, form_data, axios_config)
            .then(res => { 
                load_id(type, JOB_ID[type]);
            }).catch(err => {
                console.log(err);
                $(`#overview-${type.slice(0, 3)} .submit span`).hide();
                $(`#overview-${type.slice(0, 3)} .submit i`).show();
                $(`#overview-${type.slice(0, 3)} .submit`).prop('disabled', false).show();
            }); 
        });
    }

    // upload and delete preprocess file
    for (const tool of tools['preprocess']) {
        $(`#${tool} #input-upload`).on('change', function () {
            let file = $(this).prop('files')[0];
            let form_data = new FormData(); 
            form_data.append('file', file);
    
            $(`#${tool} .alert-warning`).hide();
            $(`#${tool} #input`).hide();
            $(`#${tool} #input-current`).show();
            $(`#${tool} #input-current #text`).text(`Current File: ${file.name}`);
            $(`#${tool} #input-current span`).show();
            $(`#${tool} #input-current i`).hide();
            $(`#${tool} #input-current`).prop('disabled', true);
            $(`#sidebar #sidebar_${tool}`).find('.bi').hide();
            $(`#sidebar #sidebar_${tool} .spinner-grow`).show();
    
            axios.post(`/sRNAanalyst/id/${JOB_ID.preprocess}/file/${tool}`, form_data, axios_config)
                .then(res => {
                    $(`#${tool} #input-current span`).hide();
                    $(`#${tool} #input-current i`).show();
                    $(`#${tool} #input-current`).prop('disabled', false);
                    $(`#sidebar #sidebar_${tool} .spinner-grow`).hide();
                    $(`#sidebar #sidebar_${tool} .bi-check-circle`).show();
                    $('#message .toast-body').text(`Success add file: ${file.name}`)
                    $('#message').toast('show');
                }).catch(err => {
                    console.log(err);
                });
        });

        $(`#${tool} #input-current`).on('click', function () {
            let name = $(this).parent().find('#text').text().substring(14);
            $(`#${tool} #input-upload`).val('');
            $(`#${tool} #input`).show();
            $(`#${tool} #input-current`).hide();
            $(`#${tool} #input-current #text`).text('');
            $('#message .toast-body').text(`Success delete reference: ${name}`)
            $('#message').toast('show');
        });
    }

    // upload reference
    for (const tool of tools['preprocess']) {
        if (tool=='workflow') {
            for (const i of ['normalization','mapping']) {
                $(`#${tool} #${i} #reference`).on('click', function () {
                    setTimeout( () => {
                        $(`#${tool} #${i} #reference-text`).text('No file chosen')
                    }, 500);
                });
                $(`#${tool} #${i} #reference`).on('change', function () {
                    if ($(this).prop('files').length > 0) {
                        $(`#${tool} #${i} #reference-text`).text($(this).prop('files')[0].name);
                    } else {
                        $(`#${tool} #${i} #reference-text`).text('No file chosen');
                    }
                });
            }
        }
    }
    for (const tool of tools['analysis']) {
        if (tool=='browser') {
            for (const i of ['1','2']) {
                $(`#${tool} #reference${i}`).on('click', function () {
                    setTimeout( () => {
                        $(`#${tool} #reference-text${i}`).text('No file chosen')
                    }, 500);
                });
                $(`#${tool} #reference${i}`).on('change', function () {
                    if ($(this).prop('files').length > 0) {
                        $(`#${tool} #reference-text${i}`).text($(this).prop('files')[0].name);
                    } else {
                        $(`#${tool} #reference-text${i}`).text('No file chosen');
                    }
                });
            }
        } else {
            $(`#${tool} #reference`).on('click', function () {
                setTimeout( () => {
                    $(`#${tool} #reference-text`).text('No file chosen')
                }, 500);
            });
            $(`#${tool} #reference`).on('change', function () {
                if ($(this).prop('files').length > 0) {
                    $(`#${tool} #reference-text`).text($(this).prop('files')[0].name);
                } else {
                    $(`#${tool} #reference-text`).text('No file chosen');
                }
            });
        }
    }

    // submit buttom
    for (const type in tools) {
        for (const tool of tools[type]) {
            $(`#${tool} #submit_${tool}`).on('click', function () {
                if (type == 'analysis') {
                    if (tool == 'browser') {
                        if ($(`#${tool} #reference-text1`).text()!='No file chosen')
                            submit(type, tool);
                        else {
                            tip(`#${tool}`, 500, reference=true);
                        }
                    }
                    else {
                        if ($(`#${tool} #reference-text`).text()!='No file chosen')
                            submit(type, tool);
                        else {
                            tip(`#${tool}`, 500, reference=true);
                        }
                    }
                }
                else if (type == 'preprocess') {
                    if ($(`#${tool} #input-current i`).is(":visible")) {
                        let validity = true;
                        if (tool == 'workflow') {
                            if ($(`#workflow #normalization #active`).prop('checked') &&
                                $('#workflow #normalization #strategy :selected').val()=='Abundance' &&
                                $(`#${tool} #normalization #reference-text`).text()=='No file chosen') {
                                    $(`#${tool} #normalization .accordion-button`).click();
                                    validity = false;
                                    tip(`#${tool} #normalization`, 600, reference=true);
                            }
                            if (validity) {
                                if ($(`#workflow #mapping #active`).prop('checked') &&
                                    $(`#${tool} #mapping #reference-text`).text()=='No file chosen') {
                                        $(`#${tool} #mapping .accordion-button`).click();
                                        validity = false;
                                        tip(`#${tool} #mapping`, 800, reference=true);  
                                }
                            }   
                        }
                        if (validity) submit(type, tool);
                    } else {
                        $(`#${tool} .alert-warning`).fadeIn();
                    }
                }
            });
        }
    }

});
