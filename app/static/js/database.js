const datas = JSON.parse($('#datas').text());

$(document).ready(function () {

    if (HCL=='True') {
        console.log('test')
        $('#database #group-table .card-title').text('Target List (C.elegans WS275)');
        $('#database #group-table table').DataTable();
    }

    // datatable style
    $('#database .datatable-top').css('font-size', '14px');
    $('#database #dataset-table table').DataTable();

    // click database and reference
    for (const type of ['dataset', 'reference']) {
        $(`#database #${type}-table`).on('click', 'td', function () {
            $(`#database #${type}-detail #prenote`).hide();
            let name = $(this).find('label').text();
            let target = datas[type];
            let item;
            for (let i=0; i<target.length; i++) {
                if (target[i].name==name) {
                    item = target[i];
                    break;
                }
            }
            let detail = '';
            for (const key in item) {
                if (key == 'url') {
                    detail += `
                        <li><b>url:</b> <a href="${item.url}" target="_blank">link
                        <i class="bi bi-box-arrow-up-right"></i></a></li>`;
                }
                else if (key != 'name' && key != 'path') {
                    detail += `<li><b>${key}:</b> ${item[key]}</li>`;
                }
            }
            let id = (HCL=='True')? "HCL" : JOB_ID.preprocess;
            $(`#database #${type}-detail #detail-block`).html(`
                        <b>${item.name}</b>
                        <ul>${detail}</ul>
                        <a type="button" class="btn btn-sm download" href="/sRNAanalyst/id/${id}/${type}/${item.name}">
                        Download <i class="bi bi-download"></i>
                        </a>
                    `);
        });
    }  

    // click target list
    $('#database #group-table .form-check-label').on('click', function () {
        let list =  $(this).text();
        let form_data = new FormData();
        form_data.append('list', list);

        $('#database #group-detail #prenote').text('Loading...please wait.');
        $('#database #group-detail #prenote').show();
        $('#database #group-detail #detail-block').hide();

        let path;
        if (HCL=='True') path = `/sRNAanalyst/HCL_list/${list}`
        else path = `/sRNAanalyst/list/${list}`;
        axios.post(path, form_data, axios_config)
            .then(res => {
                let id = (HCL=='True')? "HCL" : JOB_ID.preprocess;
                $('#database #group-detail #detail-name').text(list);
                $('#database #group-detail #detail-download').prop('href', `/sRNAanalyst/id/${id}/list/${list}`);
                $('#database #group-detail #prenote').hide();
                $('#database #group-detail #detail-block').show();

                // reset datas of table
                table = $('#database #group-detail #detail_table').DataTable({
                    dom: 'Bfrtip',
                    button: ['copy', 'csv', 'excel', 'pdf', 'print'],
                    data: res.data,
                    columns: [
                        { data: 'Gene ID', title: "Gene ID" },
                        { data: 'Transcript Name', title: "Transcript Name" },
                    ],
                    destroy: true,
                });
            })
            .catch(err => {
                console.log(err);
                $('#database #group-detail #prenote').text('Please select a transcript list on the left.');
                $('#database #group-detail #prenote').show();
                $('#database #group-detail #detail-block').hide();
            });
    });
});