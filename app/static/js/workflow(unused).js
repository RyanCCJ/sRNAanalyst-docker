let workflow = [JSON.parse($('#defaults').text()),];
let workflow_id = 0;

function change_class(dom, before, after) {
    setTimeout(() => { dom.removeClass(before).addClass(after); }, 100);
}

function change_buttons(tool, id) {
    let time = workflow[id]['time'];
    if (time >= 0) {
        $(`#${tool} #loading_time`).html(`Loading... Please wait ${time}s`);
        workflow[id]['time'] += 1;
        setTimeout(change_buttons, 1000, tool, id);
    }
}

function refresh_workflow() {

    function _refresh_page() {
        $(`#workflow .pagination`).empty();
        $(`#workflow .pagination`).append(`
            <li class="page-item" id="prev">
            <button class="page-link" aria-label="Previous">
                <span aria-hidden="true">&laquo;</span>
            </button>
            </li>
        `);
        for (let i = 1; i < workflow.length; i++) {
            let _class;
            if (i == workflow_id) _class = "page-item active";
            else _class = "page-item";
            $(`#workflow .pagination`).append(
                `<li class="${_class}"><button class="page-link">${i}</button></li>`
            );
        }
        $(`#workflow .pagination`).append(`
            <li class="page-item" id="next">
                <button class="page-link" aria-label="Next">&raquo;</button>
            </li>
        `);
        if (workflow.length == 2) {
            $(`#workflow #prev`).addClass('disabled');
            $(`#workflow #next`).addClass('disabled');
        }
        else if (workflow_id == 1) {
            $(`#workflow #prev`).addClass('disabled');
        }
        else if (workflow_id == workflow.length - 1) {
            $(`#workflow #next`).addClass('disabled');
        }
    }

    for (const type of ['trimming', 'normalization', 'mapping']) {
        for (const options of Object.keys(workflow[workflow_id][type])) {
            let dom = $(`#workflow #config-block #${type} #${options}`);
            let value = workflow[workflow_id][type][options];
            if (value === 'undefined')
                value = '';
            if (dom.is('input:text'))
                dom.val(value);
            else if (dom.is('input:file'))
                dom.val(value);
            else if (dom.is('input:checkbox')) 
                dom.prop('checked', value);
            else if (dom.is('select')) {
                dom.val(value).change();
            }
        }
    }
    $(`#workflow #config-block .card-title`).text(workflow[workflow_id]['data']);
    $(`#workflow #config-block`).hide();
    $(`#workflow #config-block`).fadeIn();
    _refresh_page();
}

function get_workflow() {
    let trimming_config, normalization_config, mapping_config, data, config;
    trimming_config = trimming();
    normalization_config = normalization();
    mapping_config = mapping();
    //data = $('#workflow #config-block .card-title').text();
    data = workflow[workflow_id]['data'];
    input_file = workflow[workflow_id]['input_file'];
    config = {
        data: data,
        input_file: input_file,
        trimming: trimming_config,
        normalization: normalization_config,
        mapping: mapping_config,
    }
    return config
}

function trimming() {
    let config, active, tool, score3, score5, adapter3, adapter5, UMI3, UMI5, max_length, min_length, max_n, extra_args;

    active = $('#workflow #trimming #active').prop('checked')? true: false;
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

function normalization() {
    let config, active, strategy, factor, tool, strand, search, number, efficiency, boundary, extra_args;

    active = $('#workflow #normalization #active').prop('checked')? true: false;
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

function mapping() {
    let config, active, filter, length, tool, strand, search, number, efficiency, boundary, extra_args;

    active = $('#workflow #mapping #active').prop('checked')? true: false;
    length = $('#workflow #mapping #length').val();
    tool = $('#workflow #mapping #tool :selected').val();
    strand = $('#workflow #mapping #strand :selected').val();
    search = $('#workflow #mapping #search :selected').val();
    number = $('#workflow #mapping #number').val();
    efficiency = $('#workflow #mapping #efficiency :selected').val();
    boundary = $('#workflow #mapping #boundary :selected').val();
    extra_args = $('#workflow #mapping #extra_args').val();

    if ($('#workflow #mapping #show_filter').is(":visible")) {
        let filter_dict = { 'head':'', 'tail':'' };
        for (const pos in filter_dict) {
            for (const nt of ['A','U','C','G']) {
                if ($(`#workflow #mapping #${pos}_${nt}`).prop("checked"))
                    filter_dict[pos] += nt;
            }
            if (filter_dict[pos]=='AUCG') 
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

$(document).ready(function () {

    // add
    $('#workflow #read-upload').on('change', function () {
        $('#workflow #read-upload').parent().hide();
        $('#workflow #read-loading').show();
        let file = $(this).prop('files')[0];
        let name = file.name;
        // delete file extension
        for (const ex of ['.zip', '.gz', '.fq', '.fastq']) {
            if (name.slice(-ex.length) == ex)
                name = name.slice(0, -ex.length);
        }
        let form_data = new FormData();
        form_data.append('file', file);
        axios.post(`/sRNAanalyst/id/${JOB_ID.preprocess}/file/workflow`, form_data, axios_config)
            .then(res => {
                if (workflow_id > 1) {
                    workflow[workflow_id] = get_workflow();
                }
                workflow_id = workflow.length
                workflow.push(structuredClone(workflow[0]));
                workflow[workflow_id]['input_file'] = file.name;
                workflow[workflow_id]['data'] = name;
                refresh_workflow(workflow_id);
                $(`#workflow #no-workflow-warning`).hide();
                $('#workflow #read-upload').parent().show();
                $('#workflow #read-loading').hide();
                $("#message .toast-body").text(`Success add workflow: ${name}`)
                $("#message").toast("show");
            })
            .catch(err => {
                console.log(err);
            });
        $(this).val('');
    });

    // remove
    $(`#workflow #config-block .btn-close`).on('click', function () {
        let name = workflow[workflow_id]['data'];
        workflow.splice(workflow_id, 1);
        workflow_id -= 1;
        if (workflow_id > 0) {
            refresh_workflow(workflow_id);
        } else {
            $(`#workflow #no-workflow-warning`).fadeIn();
            $(`#workflow #config-block`).hide();
        }
        $("#message .toast-body").text(`Success delete workflow: ${name}`)
        $("#message").toast("show");
    });

    // switch
    $(`#workflow .pagination`).on('click', '.page-link', function () {
        workflow[workflow_id] = get_workflow();
        if ($(this).parent().prop('id') == 'prev') workflow_id -= 1;
        else if ($(this).parent().prop('id') == 'next') workflow_id += 1;
        else workflow_id = Number($(this).text());
        refresh_workflow(workflow_id);
    });

    // submit
    $(`#workflow #submit`).on('click', function () {

        workflow[workflow_id] = get_workflow();

        // check reference validity
        let validity = true;
        let form_data = new FormData();
        if ($(`#workflow #normalization #active`).prop('checked') &&
            $('#workflow #normalization #strategy :selected').val()=='Abundance') {
            let target = $(`#workflow #normalization #reference`);
            if (target[0].checkValidity()) {
                form_data.append('reference_nor', target.prop('files')[0]);
                workflow[workflow_id]['normalization']['reference'] = target.prop('files')[0].name;
            } else {
                validity = false;
                target[0].reportValidity();
            }
        }
        if ($(`#workflow #mapping #active`).prop('checked')) {
            let target = $(`#workflow #mapping #reference`);
            if (target[0].checkValidity()) {
                form_data.append('reference_map', target.prop('files')[0]);
                workflow[workflow_id]['mapping']['reference'] = target.prop('files')[0].name;
            } else {
                validity = false;
                target[0].reportValidity();
            }    
        }
        if (validity) {
            form_data.append('config', JSON.stringify(workflow[workflow_id]));
            console.log(workflow[workflow_id]);

            // start loading
            $(`#sidebar #sidebar_workflow`).find('.bi').hide();
            $(`#sidebar #sidebar_workflow .spinner-grow`).show();
            $(`#workflow #submit`).hide();
            $(`#workflow #submit_loading`).show();
            $(`#workflow #result_workflow`).hide();
            workflow[workflow_id]['time'] = 0;
            change_buttons('workflow', workflow_id); 

            url = `/sRNAanalyst/id/${JOB_ID.preprocess}/preprocess/workflow`;
            axios.post(url, form_data, axios_config)
                .then(res => {
                axios.get(url).then(res => {
                    $(`#sidebar #sidebar_workflow .bi-check-circle`).show();
                    $(`#sidebar #sidebar_workflow .spinner-grow`).hide();
                    $(`#workflow #submit`).show();
                    $(`#workflow #submit_loading`).hide();
                    show_result('workflow', res.data, JOB_ID.preprocess);
                    console.log('running time: ' + workflow[workflow_id]['time']+ 's');
                    workflow[workflow_id]['time'] = -1;        
                }).catch(err => { 
                    console.log(err);
                    $(`#sidebar #sidebar_workflow .bi-circle`).show();
                    $(`#sidebar #sidebar_workflow .spinner-grow`).hide();
                    $(`#workflow #submit`).show();
                    $(`#workflow #submit_loading`).hide();
                    $(`#workflow #result_workflow`).hide();
                    workflow[workflow_id]['time'] = -2;
                });
                }).catch(err => {
                    console.log(err);
                    if (err.response) {
                        if (err.response.status == 504) {
                            // 504 Gateway timeout
                            alert("Server timeout! Please check if your data is ready.");
                        }
                        else if (err.response.status == 406) {
                            // 406 Not Acceptable
                            let target = $('#workflow #trimming #extra_args');
                            target[0].setCustomValidity(err.response.data);
                            target[0].reportValidity();
                        }
                        else alert("Something Wrong! Please contact us for more detail.");
                    }
                    else {
                        alert("Something Wrong! Please contact us for more detail.");
                    }
                    $(`#sidebar #sidebar_workflow .bi-circle`).show();
                    $(`#sidebar #sidebar_workflow .spinner-grow`).hide();
                    $(`#workflow #submit`).show();
                    $(`#workflow #submit_loading`).hide();
                    $(`#workflow #result_workflow`).hide();
                    workflow[workflow_id]['time'] = -2;
                });
        }
    });

    // accordion CSS
    $('#workflow .accordion-button').on('click', function () {
        for (const type of ['trimming', 'normalization', 'mapping']) {
            let dom = $(`#workflow #${type} .form-check.form-switch`);
            if ($(`#workflow #${type} .accordion-button`).hasClass('collapsed')) {
                if (dom.hasClass('type2'))
                    change_class(dom, 'type2', 'type1');
                else if (dom.hasClass('type3'))
                    change_class(dom, 'type3', 'type1');
            } else {
                change_class(dom, 'type1', 'type2');
            }
        }
    });

    // normalization strategy
    $('#workflow #normalization #strategy').on('change', function () {
        let value = $(this).val();
        if (value == 'Factor') {
            $('#workflow #normalization .strategy-factor').show();
            $('#workflow #normalization .strategy-abundance').hide();
            $('#workflow #normalization .bowtie2').hide();
        }
        else if (value == 'Abundance') {
            $('#workflow #normalization .strategy-factor').hide();
            $('#workflow #normalization .strategy-abundance').show();
            if ($('#workflow #normalization #tool').val() == 'bowtie2')
                $('#workflow #normalization .bowtie2').show();
            else
                $('#workflow #normalization .bowtie2').hide();
        }
        else {
            $('#workflow #normalization .strategy-factor').hide();
            $('#workflow #normalization .strategy-abundance').hide();
            $('#workflow #normalization .bowtie2').hide();
        }
    });

    // mapping filter
    $('#workflow #mapping #no_filter #filter').on('change', function () {
        if ($(this).val() == 'yes') {
            $('#workflow #mapping #no_filter').hide();
            $('#workflow #mapping #show_filter').show();
            $('#workflow #mapping #no_filter #filter').val('no').change();
        }
    });
    $('#workflow #mapping #show_filter #filter').on('change', function () {
        if ($(this).val() == 'no') {
            $('#workflow #mapping #no_filter').show();
            $('#workflow #mapping #show_filter').hide();
            $('#workflow #mapping #show_filter #filter').val('yes').change();
        }
    });

    // bowtie2
    for (const type of ['normalization', 'mapping']) {
        $(`#workflow #${type} #tool`).on('change', function () {
            if ($(this).val() == 'bowtie2')
                $(`#workflow #${type} .bowtie2`).show();
            else
                $(`#workflow #${type} .bowtie2`).hide();
        });
        $(`#workflow #${type} #search`).on('change', function () {
            if ($(this).val() == 'limited')
                $(`#workflow #${type} .limited_align`).show();
            else
                $(`#workflow #${type} .limited_align`).hide();
        });
    }

});