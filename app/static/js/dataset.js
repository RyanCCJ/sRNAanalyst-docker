let data_condition = 1;

let data_config_num = {
    single: 0,
    paired: 0,
};

let data = {
    single: [],
    paired: [],
}

let paired = false;

function check_data() {
    return $('#dataset #switch-data').prop("checked") ? data.paired : data.single;
    /*
    switch (condition) {
        case 1:
            break;
        case 2:
            return data.single;
        case 3:
            return data.paired;
        case 4:
            
            if (paired) return data.paired;
            else return data.single;
        default:
            alert("Sometiong wrong in data-checking.");
    }
    return [];*/
}

function delete_data(target, index) {
    for (let i = 0; i < target.length; i++) {
        if (target[i].index == index) {
            target.splice(i, 1);
        }
    }
    if (group.length == 0) {
        $('#group #default').removeClass('text-danger').addClass('text-success').text('(enabled)');
    }
}

function refresh_data(load=false) {

    paired = $('#dataset #switch-data').prop("checked") ? true : false;

    if (paired) {
        if (data['paired'].length == 0) {
            $('.single-data-warning').show();
            $('.paired-data-warning').show();
            $('.single-data').hide();
            $('.paired-data').hide();
        } else {
            $('.single-data-warning').hide();
            $('.paired-data-warning').hide();
            $('.single-data').show();
            $('.paired-data').show();
        }
    } else {
        $('.paired-data-warning').show();
        $('.paired-data').hide();
        if (data['single'].length == 0) {
            $('.single-data-warning').show();
            $('.single-data').hide();
        } else {
            $('.single-data-warning').hide();
            $('.single-data').show();
        }
    }

    if (paired && group.length > 1) {
        $('.condition4').show();  
    } else {
        $('.condition4').hide();
    }

    if (load) {
        if (data['single'].length > 0) {
            $('#dataset #single #upload-text').text(`${data['single'][0]['name']}.csv`);
            //$('#dataset #single #single_check').prop("checked", true);
            $('#dataset #single .bi-check-circle').show();
            $('#dataset #single .bi-upload').hide();
        }
        if (data['paired'].length > 1) {
            $('#dataset #paired #upload-text').text(`${data['paired'][0]['name']}.csv`);
            $('#dataset #paired #upload2-text').text(`${data['paired'][1]['name']}.csv`);
            //$('#dataset #paired #paired_check').prop("checked", true);
            $('#dataset #paired .bi-check-circle').show();
            $('#dataset #paired .bi-upload').hide();
        } 
    }

    // data_condition
    // 1: single(x), paired(x)
    // 2: single(v), paired(x)
    // 3: single(x), paired(v)
    // 4: single(v), paired(v)

    /*
    if (data['paired'].length == 0) {
        $('.paired-data-warning').show();
        $('.paired-data').hide();
        if (data['single'].length == 0) {
            data_condition = 1;
            $('.single-data-warning').show();
            $('.single-data').hide();
        } else {
            data_condition = 2;
            $('.single-data-warning').hide();
            $('.single-data').show();
        }
    } else {
        data_condition = (data['single'].length==0)? 3:4;
        $('.single-data-warning').hide();
        $('.single-data').show();
        $('.paired-data-warning').hide();
        $('.paired-data').show();
    }
    */
    
    // config_condition
    // 1: data(1), group(1)
    // 2: data(1), group(N)
    // 3: data(N), group(1)
    // 4: data(N), group(N)

    /*
    if (group.length > 1) {
        if (data['paired'].length > 1) {
            $('.single-condition4').show();
            $('.paired-condition4').show();      
        } else {
            $('.single-condition4').hide();
            $('.paired-condition4').hide();
            if (data['single'].length > 1) {
                $('.single-condition4').show();
            } else {
                $('.single-condition4').hide();
            }
        }
    } else {
        $('.single-condition4').hide();
        $('.paired-condition4').hide();
    } 
    */ 
}

$(document).ready(function () {

    // add single data
    /*$(`#dataset #single #example`).on('click', function () {
        if ($('#dataset #single #new-data_0').length == 0) {
            let new_content = `
                <div class="input-group input-group-sm mb-3" id="new-data_0">
                <div class="input-group-text fw-bold">
                Active
                <input class="form-check-input mt-0 ms-1" type="checkbox" checked>
                </div>
                <label class="input-group-text">Example File</label>
                <div class="input-group-text bg-white">
                <a href='/sRNAanalyst/download/example/WAGO1_IP_WT.csv'>
                    WAGO1_IP_WT.csv <i class="bi bi-download"></i>
                </a>
                </div>
                <input type="text" class="form-control bg-white" style="border-left:none;" disabled>
                <div class="input-group-text">
                (Example)
                <i class="btn bi bi-x-circle p-0 delete-data ms-2" id="delete-data_0" title="delete this data"
                    style="font-size:14px;"></i>
                </div>
                </div>
                `;
            $(`#dataset #single #new-data-block`).prepend(new_content);
        }
    });
    $(`#dataset #single #add`).on('click', function () {
        data_config_num['single'] += 1;
        let new_content = `
            <div class="input-group input-group-sm mb-3" id="new-data_${data_config_num['single']}">
            <div class="input-group-text fw-bold">
            Active
            <span class="spinner-border spinner-border-sm ms-1" role="status" style="display:none;"></span>
            <input class="form-check-input mt-0 ms-1" type="checkbox" value="">
            </div>
            <input type="file" class="form-control" id="upload">
            <div class="input-group-text">
            <i class="btn bi bi-x-circle p-0 delete-data" id="delete-data_${data_config_num['single']}" title="delete this data"
                style="font-size:14px;"></i>
            </div>
            </div>
            `;
        $(`#dataset #single #new-data-block`).append(new_content);
    });*/

    // add paired data
    /*$(`#dataset #paired #example`).on('click', function () {
        if ($('#dataset #paired #new-data_0').length == 0) {
            let new_content = `
                <div class="card mb-3 p-3" style="border:1px Silver solid;" id="new-data_0">
                <div class="row">
                <div class="col-md-12 d-flex justify-content-between">
                    <div class="d-flex">
                    <label class="form-label fw-bold col-form-label-sm mb-0">Active</label>
                    <input class="form-check-input mt-2 ms-2" type="checkbox" checked>
                    <span class="text-black-50 mt-1 ms-2">(Example) </span>
                    </div>
                    <button type="button" class="btn-close delete-data" id="delete-data_0"
                    style="background-size:50%;height:auto;"></button>
                </div>
                <div class="col-md-6">
                    <label class="form-label fw-bold col-form-label-sm mb-0">Control</label>
                    <div class="input-group input-group-sm">
                    <label class="input-group-text">Example File</label>
                    <div class="input-group-text bg-white">
                        <a href='/sRNAanalyst/download/example/WAGO1_IP_WT.csv'>
                        WAGO1_IP_WT.csv <i class="bi bi-download"></i>
                        </a>
                    </div>
                    <input type="text" class="form-control bg-white" style="border-left:none;" disabled>
                    </div>
                </div>
                <div class="col-md-6">
                    <label class="form-label fw-bold col-form-label-sm mb-0">Mutant</label>
                    <div class="input-group input-group-sm">
                    <label class="input-group-text">Example File</label>
                    <div class="input-group-text bg-white">
                        <a href='/sRNAanalyst/download/example/WAGO1_IP_PRG1_MUT.csv'>
                        WAGO1_IP_PRG1_MUT.csv <i class="bi bi-download"></i>
                        </a>
                    </div>
                    <input type="text" class="form-control bg-white" style="border-left:none;" disabled>
                    </div>
                </div>
                </div>
                </div>
                `;
            $(`#dataset #paired #new-data-block`).prepend(new_content);
        }
    });
    $(`#dataset #paired #add`).on('click', function () {
        data_config_num['paired'] += 1;
        let new_content = `
            <div class="card mb-3 p-3" style="border:1px Silver solid;" id="new-data_${data_config_num['paired']}">
            <div class="row">
            <div class="col-md-12 d-flex justify-content-between">
                <div class="d-flex">
                <label class="form-label fw-bold col-form-label-sm mb-0">Active</label>
                <span class="spinner-border spinner-border-sm mt-2 ms-2" role="status" style="display:none;"></span>
                <input class="form-check-input mt-2 ms-2" type="checkbox" value="">
                </div>
                <button type="button" class="btn-close delete-data" id="delete-data_${data_config_num['paired']}"
                style="background-size:50%;height:auto;"></button>
            </div>
            <div class="col-md-6">
                <label class="form-label fw-bold col-form-label-sm mb-0">Control</label>
                <input type="file" class="form-control form-control-sm" id="upload">
            </div>
            <div class="col-md-6">
                <label class="form-label fw-bold col-form-label-sm mb-0">Mutant</label>
                <input type="file" class="form-control form-control-sm" id="upload2">
            </div>
            </div>
            </div>
            `;
        $(`#dataset #paired #new-data-block`).append(new_content);
    });*/

    // delete config
    /*for (const data_type of ['single', 'paired']) {
        $(`#dataset #${data_type} #new-data-block`).on('click', '.delete-data', function () {
            let index = this.id.split('_')[1];
            data_config_num[data_type] -= 1;
            delete_data(data[data_type], index);
            $(`#dataset #${data_type} #new-data_${index}`).remove();
            $("#message .toast-body").text(`Success delete dataset`);
            $("#message").toast("show");
            refresh_data();
        });
    }*/

    // click active
    /*
    for (const data_type of ['single', 'paired']) {
        $(`#dataset #${data_type} #new-data-block`).on('change', '.form-check-input', function () {
            let index, file = [], name = '';
            if (data_type == 'single') {
                index = $(this).parent().parent().prop('id').split('_')[1];
                file.push($(this).parent().parent().find('#upload').prop('files')[0]);
                name = file[0].name;
            }
            else if (data_type == 'paired') {
                index = $(this).parent().parent().parent().parent().prop('id').split('_')[1];
                file.push($(this).parent().parent().parent().find('#upload').prop('files')[0]);
                file.push($(this).parent().parent().parent().find('#upload2').prop('files')[0]);
                name = file[0].name + ', ' + file[1].name;
            }
            if (this.checked) {
                for (let i = 0; i < file.length; i++) {
                    $(`#sidebar #sidebar_dataset`).find('.bi').hide();
                    $(`#sidebar #sidebar_dataset .spinner-grow`).show();
                    $(`#dataset #${data_type} #new-data_${index} .spinner-border`).show();
                    $(`#dataset #${data_type} #new-data_${index} .form-check-input`).hide();
                    let data_name = file[i].name;
                    if (file[i].name.slice(-4)=='.csv')
                        data_name = file[i].name.slice(0,-4);
                    data[data_type].push({
                        'name': data_name,
                        'index': index,
                        'upload': true,
                    });
                    let form_data = new FormData();
                    form_data.append('file', file[i]);
                    axios.post(`/sRNAanalyst/upload/dataset/file`, form_data, axios_file_config)
                        .then(res => {
                            $(`#sidebar #sidebar_dataset .spinner-grow`).hide();
                            $(`#sidebar #sidebar_dataset .bi-check-circle`).show();
                            $(`#dataset #${data_type} #new-data_${index} .spinner-border`).hide();
                            $(`#dataset #${data_type} #new-data_${index} .form-check-input`).show();
                            if (i == file.length - 1) {
                                $("#message .toast-body").text(`Active dataset: ${name}`)
                                $("#message").toast("show");
                            }
                        })
                        .catch(err => {
                            console.log(err);
                        });
                }
            }
            else {
                delete_data(data[data_type], index);
                $("#message .toast-body").text(`Cancel dataset: ${name}`)
                $("#message").toast("show");
            }
            refresh_data();
        });
    }
    */

    // switch data
    $('#dataset #switch-data').on('change', function () {
        if (this.checked) {
            $(`#dataset #single`).hide();
            $(`#dataset #paired`).fadeIn();
        }
        else {
            $(`#dataset #single`).fadeIn();
            $(`#dataset #paired`).hide();
        }
        refresh_data();
    });

    // click active
    for (const data_type of ['single', 'paired']) {
        $(`#dataset #${data_type} #active-btn`).on('click', function () {

            let index = 1, file = [], name = '', validity = true;
            if (data_type == 'single') {
                let target = $(`#dataset #${data_type} #upload`);
                if (target.prop('files').length > 0) {
                    file.push(target.prop('files')[0]);
                    name = file[0].name;
                } else {
                    validity = false;
                    tip(`#dataset #${data_type}`);
                }  
            }
            else if (data_type == 'paired') {
                for (const i of ['','2']) {
                    let target = $(`#dataset #${data_type} #upload${i}`);
                    if (target.prop('files').length > 0) {
                        file.push(target.prop('files')[0]);
                        name = file[0].name +', ';
                    } else {
                        validity = false;
                        if (i =='') tip(`#dataset #${data_type} #control`);
                        else tip(`#dataset #${data_type} #mutant`);
                    }
                }
                name = validity? name.slice(0,-2):name;
            }
            if (validity) {
                let num = 0; 
                for (let i = 0; i < file.length; i++) {
                    delete_data(data[data_type], index=i+1);
                    $(`#sidebar #sidebar_dataset`).find('.bi').hide();
                    $(`#sidebar #sidebar_dataset .spinner-grow`).show();
                    $(`#dataset #${data_type} .bi-check-circle`).hide();
                    $(`#dataset #${data_type} .bi-upload`).hide();
                    $(`#dataset #${data_type} .spinner-border`).show();
                    /*
                    $(`#sidebar #sidebar_dataset`).find('.bi').hide();
                    $(`#sidebar #sidebar_dataset .spinner-grow`).show();
                    $(`#dataset #${data_type} .spinner-border`).show();
                    $(`#dataset #${data_type} .form-check-input`).hide();
                    */

                    let form_data = new FormData();
                    form_data.append('file', file[i]);
                    
                    // Update data config
                    let data_name = file[i].name;
                    if (file[i].name.slice(-4)=='.csv')
                        data_name = file[i].name.slice(0,-4);
                    data[data_type].push({
                        'name': data_name,
                        'index': i+1,
                        'upload': true,
                    }); 
                    // Save data config in asynchronous operation
                    if (i == file.length - 1) {
                        let data_config = JSON.stringify({ data:data, group:group })
                        form_data.append('data', data_config);
                    }

                    // Calculate the successful upload number, 
                    // as asynchronous operations result in a different upload order.
                    axios.post(`/sRNAanalyst/id/${JOB_ID.analysis}/file/dataset`, form_data, axios_config)
                        .then(res => {
                            num += 1;
                            if (num == file.length) {
                                $(`#sidebar #sidebar_dataset .spinner-grow`).hide();
                                $(`#sidebar #sidebar_dataset .bi-check-circle`).show();
                                $(`#dataset #${data_type} .spinner-border`).hide();
                                $(`#dataset #${data_type} .bi-check-circle`).show();
                                //$(`#dataset #${data_type} .form-check-input`).show();
                                $("#message .toast-body").text(`Active dataset: ${name}`)
                                $("#message").toast("show");
                            }
                        })
                        .catch(err => {
                            console.log(err);
                            alert("Something Wrong.");
                            $(`#sidebar #sidebar_dataset .spinner-grow`).hide();
                            $(`#sidebar #sidebar_dataset`).find('.bi').show();
                            $(`#dataset #${data_type} .bi-upload`).show();
                            $(`#dataset #${data_type} .spinner-border`).hide();
                            //$(`#dataset #${data_type} .form-check-input`).show();
                            $(`#dataset #${data_type} .form-check-input`).prop("checked", false);
                        });
                }
            }
            /*else {
                name = data[data_type][0]['name'];
                delete_data(data[data_type], index=1);
                if (data_type == 'paired') {
                    name += ', ' + data[data_type][0]['name'];
                    delete_data(data[data_type], index=2);    
                }    
                $("#message .toast-body").text(`Cancel dataset: ${name}`)
                $("#message").toast("show");
            }*/
            refresh_data();
        });
    }

    // change data
    for (const data_type of ['single', 'paired']) {
        $(`#dataset #${data_type} #upload`).on('click', function () {
            setTimeout( () => {
                $(`#dataset #${data_type} #upload-text`).text('No file chosen')
            }, 500);
            $(`#dataset #${data_type} .bi-check-circle`).hide();
            $(`#dataset #${data_type} .bi-upload`).show();
            //$(`#dataset #${data_type} .form-check-input`).prop('checked', false);
        });
        $(`#dataset #${data_type} #upload`).on('change', function () {
            if ($(this).prop('files').length > 0) {
                $(`#dataset #${data_type} #upload-text`).text($(this).prop('files')[0].name);
            } else {
                $(`#dataset #${data_type} #upload-text`).text('No file chosen');
            }
            $(`#dataset #${data_type} .bi-check-circle`).hide();
            $(`#dataset #${data_type} .bi-upload`).show();
            //$(`#dataset #${data_type} .form-check-input`).prop('checked', false);
        });
    }
    $('#dataset #paired #upload2').on('click', function () {
        setTimeout( () => {
            $('#dataset #upload2-text').text('No file chosen')
        }, 500);
        $(`#dataset #paired .bi-check-circle`).hide();
        $(`#dataset #paired .bi-upload`).show();
        //$('#dataset #paired .form-check-input').prop('checked', false);
    });
    $('#dataset #paired #upload2').on('change', function () {
        if ($(this).prop('files').length > 0) {
            $('#dataset #upload2-text').text($(this).prop('files')[0].name);
        } else {
            $('#dataset #upload2-text').text('No file chosen');
        }
        $(`#dataset #paired .bi-check-circle`).hide();
        $(`#dataset #paired .bi-upload`).show();
        //$('#dataset #paired .form-check-input').prop('checked', false);
    });
});