let group_config_num = 0;
let group = [];
let group_ref = {};

function add_group(target, name, check=false) {
    group_config_num += 1;
    let checked = (check)? 'checked':'';
    let new_content = `
        <div class="input-group input-group-sm mb-3" id="new-data_${group_config_num}">
            <div class="input-group-text fw-bold">
                Active
                <input class="form-check-input mt-0 ms-1" type="checkbox" ${checked}>
            </div>
            <div class="input-group-text bg-white" id="name">${name}</div>
            <input type="text" class="form-control bg-white" style="border-left:none;" disabled>
            <div class="input-group-text">
                <i class="btn bi bi-x-circle p-0 delete-data" id="delete-data_${group_config_num}" 
                title="delete this group" style="font-size:14px;"></i>
            </div>
        </div>
    `;
    $(target).append(new_content);
}

$(document).ready(function () {

    // add reference
    $('#group #reference-upload').on('change', function () {
        let file = $(this).prop('files')[0];
        $('#group #reference').hide();
        $('#group #reference-current #text').text(`Current Reference: ${file.name}`);
        $('#group #reference-current span').show();
        $('#group #reference-current i').hide();
        $('#group #reference-current').prop('disabled', true).show();
        $(`#sidebar #sidebar_group`).find('.bi').hide();
        $(`#sidebar #sidebar_group .spinner-grow`).show();
        let reader = new FileReader();
        reader.onload = function (event) {
            // load reference into gene-transcript (key-value) pair
            let content = event.target.result.split('>');
            for (let i = 0; i < content.length; i++) {
                content[i] = content[i].split('\n')[0];
                let annt = content[i].split(' ');
                let trans = annt[0];
                for (let j = 1; j < annt.length; j++) {
                    if (annt[j].slice(0, 5) == 'gene=') {
                        let gene = annt[j].slice(5);
                        if (gene in group_ref) group_ref[gene].push(trans);
                        else group_ref[gene] = [trans,];
                        break;
                    }
                }
            }
            content = null;
            $('#group #reference-current span').hide();
            $('#group #reference-current i').show();
            $('#group #reference-current').prop('disabled', false);
            $(`#sidebar #sidebar_group .spinner-grow`).hide();
            $(`#sidebar #sidebar_group .bi-check-circle`).show();
            $('#message .toast-body').text(`Success add reference: ${file.name}`)
            $('#message').toast('show');
        }
        reader.readAsText(file);
        $(this).val('');
    });

    // delete reference
    $('#group #reference-current').on('click', function () {
        group_ref = {};
        let name = $(this).parent().find('#text').text().substring(19);
        $(`#group #reference`).show();
        $(`#group #reference-current`).hide();
        $('#message .toast-body').text(`Success delete reference: ${name}`)
        $('#message').toast('show');
    });

    // add group
    $('#group #add').on('click', function () {
        let title = $('#group #title').val();
        let list = $('#group #list').val().split('\n');
        if ($('#group form')[0].checkValidity()) {
            $('#group #add span').show();
            $('#group #add i').hide();
            $('#group #add').prop('disabled', true);
            $(`#sidebar #sidebar_group`).find('.bi').hide();
            $(`#sidebar #sidebar_group .spinner-grow`).show();

            // gene-to-transcript conversion
            let new_list = [];
            if (Object.keys(group_ref).length == 0) {
                new_list = list;
            } else {
                for (let i = 0; i < list.length; i++) {
                    let gene = list[i];
                    if (gene in group_ref) {
                        for (let j = 0; j < group_ref[gene].length; j++) {
                            new_list.push(group_ref[gene][j]);
                        }
                    } else new_list.push(gene);
                }
            }

            // send group to backend
            let blob = new Blob([new_list.join('\n')], { type: 'text/plain' });
            let file = new File([blob], title, { type: 'text/plain' });
            let form_data = new FormData();
            form_data.append('file', file);
            axios.post(`/sRNAanalyst/id/${JOB_ID.analysis}/file/group`, form_data, axios_config)
                .then(res => {
                    add_group('#group #new-group-block', title);
                    $('#group #add span').hide();
                    $('#group #add i').show();
                    $('#group #add').prop('disabled', false);
                    $(`#sidebar #sidebar_group .spinner-grow`).hide();
                    $(`#sidebar #sidebar_group .bi-check-circle`).show();
                    $('#message .toast-body').text(`Success add group: ${file.name}`)
                    $('#message').toast('show');
                })
                .catch(err => {
                    console.log(err);
                });
        }
        else $('#group form')[0].reportValidity();
    });

    // upload groups
    $('#group #upload input').on('change', function () {
        $('#group #upload').hide();
        $('#group #upload_loading').show();
        $(`#sidebar #sidebar_group`).find('.bi').hide();
        $(`#sidebar #sidebar_group .spinner-grow`).show();
        let file = $(this).prop('files')[0];
        let form_data = new FormData();
        form_data.append('file', file);
        form_data.append('reference', JSON.stringify(group_ref));
        axios.post(`/sRNAanalyst/id/${JOB_ID.analysis}/file/groups`, form_data, axios_config)
            .then(res => {
                let groups = res.data.split('|');
                for (const group_name of groups)
                    add_group('#group #new-group-block2', group_name);  
                $('#group #upload').show();
                $('#group #upload_loading').hide();
                $(`#sidebar #sidebar_group .spinner-grow`).hide();
                $(`#sidebar #sidebar_group .bi-check-circle`).show();
                $('#message .toast-body').text(`Success add group: ${file.name}`)
                $('#message').toast('show');
            })
            .catch(err => {
                console.log(err);
            });
        $(this).val('');
    });

    // delete group
    for (const group_block of ['new-group-block', 'new-group-block2']) {
        $(`#group #${group_block}`).on('click', '.delete-data', function () {
            let index = this.id.split('_')[1];
            let name = $(this).parent().parent().find('#name').text();
            delete_data(group, index);
            $(this).parent().parent().remove();
            $(this).val('');

            // delete group on server
            axios.delete(`/sRNAanalyst/id/${JOB_ID.analysis}/group/${name}`, axios_config)
            .then(res => {
                $("#message .toast-body").text(`Success delete group: ${name}`);
                $("#message").toast("show");
            })
            .catch(err => {
                console.log(err);
            });
        });
    }

    // click active
    $('#group').find('#new-group-block, #new-group-block2').on('change', '.form-check-input', function () {
        let index = $(this).parent().parent().prop('id').split('_')[1];
        let name = $(this).parent().parent().find('#name').text();
        if (this.checked) {
            group.push({
                'name': name,
                'index': index,
                'upload': true,
            });
            $('#group #default').removeClass('text-success').addClass('text-danger').text('(disabled)');
        } else {
            delete_data(group, index);
        }
        refresh_data();
    });

});