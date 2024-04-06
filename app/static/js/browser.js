/* Analysis browser */

let table_data = {};

/* Target RNA Table */
function print_table(target, data) {
    $('#result_browser').show();
    if (data.length == 0) {
        alert('Unknown data, please check your reference file.')
    }

    // paired-data
    let RC = 'Read Count (Mut/WT)';
    if (RC in data[0]) {
        paired = 'paired';
    } else {
        paired = '';
        RC = 'Read Count';
    }
    // Dynamic rendering table
    let columns = [{ data: 'Reference ID', title: 'Reference ID' },];
    for (const key in data[0]) {
        if (key == RC) {
            columns.push({
                data: null, title: key,
                render: function (data, type, row, meta) {
                    return row[RC].toExponential(3);
                }
            });
        }
        else if (key == 'p-value') {
            columns.push({
                data: null, title: key,
                render: function (data, type, row, meta) {
                    return row['p-value'].toExponential(3);
                }
            });
        }
        else if (key != 'Reference ID')
            columns.push({ data: key, title: key });
    }
    columns.push({
        data: null, title: 'Detail',
        render: function (data, type, row, meta) {
            return `
                <button class="btn btn-sm btn-outline-secondary detail_btn ${paired}" id="${row['Reference ID']}"
                onclick="get_detail(this)">
                <div class="d-flex align-items-center" style="white-space:nowrap;">
                    show detail
                    <span class="spinner-border spinner-border-sm ms-1 hide" role="status"></span>
                </div>
                </button>
            `;
        }
    });
    // Delete old Datatable
    $('#browser #ref_table_parent').html(`
        <table class="table table-sm datatable table-striped table-hover compact cell-border" id="ref_table"></table>
    `);
    // Create new DataTable
    new DataTable(target, {
        dom: 'Bfrtip',
        button: ['copy', 'csv', 'excel', 'pdf', 'print'],
        data: data,
        columns: columns,
        paging: true,
        searching: true,
        destroy: true,
    });
    $(target).css("width", "100%");
}

function get_detail(target) {

    tool = 'browser';
    id = $(target).prop('id');

    $(`#sidebar #sidebar_${tool}`).find('.bi').hide();
    $(`#sidebar #sidebar_${tool} .spinner-grow`).show();
    $('#browser .detail_btn').prop('disabled', true);
    $(target).find('span').show();
    $('#browser #detail_browser').hide();

    axios.get(`/sRNAanalyst/id/${JOB_ID['analysis']}/site/${id}`)
        .then(res => {
            $('#browser #detail_browser').show();
            $('.transcript_name').html(id);
            if ($(target).hasClass('paired')) {
                $('#accordion_2').show();
                $('#acc_text_1').text('Table View (Control)');
                $('#acc_text_2').text('Table View (Mutant)');
                print_detail_table('#browser #site_table', res.data.site_table[0]);
                print_detail_table('#browser #site_table_mut', res.data.site_table[1]);
            } else {
                $('#accordion_2').hide();
                $('#acc_text_1').text('Table View');
                print_detail_table('#browser #site_table', res.data.site_table[0]);
            }
            draw(res.data);
            $(`#sidebar #sidebar_${tool} .bi-check-circle`).show();
            $(`#sidebar #sidebar_${tool} .spinner-grow`).hide();
            $('#browser .detail_btn').prop('disabled', false);
            $(target).find('span').hide();
            $('#message .toast-body').text(`Success load transcript: ${id}`)
            $('#message').toast('show');
        })
        .catch(err => {
            console.log(err);
            alert("Something Wrong! Please verify that all input formats are correct. \nIf the input format is confirmed to be correct and the issue persists, please try reloading the page.");
            $('#browser #detail_browser').hide();
            $(`#sidebar #sidebar_${tool} .bi-check-circle`).show();
            $(`#sidebar #sidebar_${tool} .spinner-grow`).hide();
            $('#browser .detail_btn').prop('disabled', false);
            $(target).find('span').hide();
        });

    /*
    if ($(`#${tool} #reference`)[0].checkValidity()) {
        $(`#sidebar #sidebar_${tool}`).find('.bi').hide();
        $(`#sidebar #sidebar_${tool} .spinner-grow`).show();
        $('#browser .detail_btn').prop('disabled', true);
        $(target).find('span').show();
        $('#browser #detail_browser').hide();

        let form_data = new FormData();
        form_data.append('config', JSON.stringify(table_data));
        let reference = $(`#${tool} #reference`).prop('files')[0];
        form_data.append('reference', reference);
        if ($(`#${tool} #reference2`).prop('files').lenght !== 0) {
            let reference2 = $(`#${tool} #reference2`).prop('files')[0];
            form_data.append('reference2', reference2);
        }

        axios.post(`/sRNAanalyst/id/${JOB_ID['analysis']}/site/${id}`, form_data, axios_config)
            .then(res => {
                $('#browser #detail_browser').show();
                $('.transcript_name').html(id);
                if ($(target).hasClass('paired')) {
                    $('#accordion_2').show();
                    $('#acc_text_1').text('Table View (Control)');
                    $('#acc_text_2').text('Table View (Mutant)');
                    print_detail_table('#browser #site_table', res.data.site_table[0]);
                    print_detail_table('#browser #site_table_mut', res.data.site_table[1]);
                } else {
                    $('#accordion_2').hide();
                    $('#acc_text_1').text('Table View');
                    print_detail_table('#browser #site_table', res.data.site_table[0]);
                }
                draw(res.data);
                $(`#sidebar #sidebar_${tool} .bi-check-circle`).show();
                $(`#sidebar #sidebar_${tool} .spinner-grow`).hide();
                $('#browser .detail_btn').prop('disabled', false);
                $(target).find('span').hide();
                $('#message .toast-body').text(`Success load transcript: ${id}`)
                $('#message').toast('show');
            })
            .catch(err => {
                console.log(err);
                alert("Something Wrong! Please verify that all input formats are correct. \nIf the input format is confirmed to be correct and the issue persists, please try reloading the page. \nIf there are any issues, please contact us for more detail.");
                $('#browser #detail_browser').hide();
                $(`#sidebar #sidebar_${tool} .bi-check-circle`).show();
                $(`#sidebar #sidebar_${tool} .spinner-grow`).hide();
                $('#browser .detail_btn').prop('disabled', false);
                $(target).find('span').hide();
            });
    } else {
        $(`#${tool} #reference`)[0].reportValidity();
        $(window).scrollTop($(`#${tool} #reference`).position().top);
    }
    */
}

/* Detail Table View */
function print_detail_table(target, data) {

    // Lock the order of the first two columns
    let columns = [
        { data: 'Read ID', title: 'Read ID' },
        { data: 'Reference ID', title: 'Reference ID' },
    ];
    // Dynamic rendering columns
    for (const key in data[0]) {
        if (!['Read ID', 'Reference ID', 'Read Sequence', 'Reference Sequence', 'site_height'].includes(key))
            columns.push({ data: key, title: key });
    }
    // Append final column
    if (('Read Sequence' in data[0]) && ('Reference Sequence' in data[0])) {
        columns.push({
            data: null, title: 'Alignment Result<br>(top:reference, bottom:read)',
            render: function (data, type, row, meta) {
                if (row['Strand'] == '+')
                    return `<span class="align_text">5' ${row['Reference Sequence']} 3'<br>5' ${row['Read Sequence']} 3'</span>`;
                else
                    return `<span class="align_text">5' ${row['Reference Sequence']} 3'<br>3' ${row['Read Sequence']} 5'</span>`;
            }
        });
    }
    else if ('Read Sequence' in data[0]) {
        columns.push({ data: 'Read Sequence', title: 'Read Sequence' });
    }
    // Create DataTable
    new DataTable(target, {
        dom: 'Bfrtip',
        button: ['copy', 'csv', 'excel', 'pdf', 'print'],
        data: data,
        columns: columns,
        paging: true,
        searching: true,
        destroy: true,
    });
    $(target).css("width", "100%");
}

/* Detail Graphical View */
function draw(data) {

    function _draw_site_and_count(site_table, site_index, count_index, max_count) {
        if (site_table.length > 0) {
            up = (site_index == 1) ? true : false;
            draw_site(`#site${site_index}`, site_table, domain_end, up);
        } else {
            $(`#site${site_index}_table`).hide();
        }
        if (site_table.length > 0) {
            up = (count_index == 1) ? true : false;
            draw_count(`#count${count_index}`, site_table, domain_end, up, max_count)
        } else {
            $(`#count${count_index}`).html('<h5 class="text-center">No sRNA found on this transcript</h5>');
        }
    }

    // region bar
    if (data.region_table.length > 1) {
        $('#browser #UTR_bar').show();
        $('#browser #region').find('.hint, small').show();
        $('#browser #region small.ALL').text('UTR');
        let UTR_end = draw_bar('#UTR_bar', data.region_table, UTR = true, EXON = false);
    } else {
        $('#browser #UTR_bar').hide();
        $('#browser #region').find('.hint, small').hide();
        $('#browser #region .ALL').show();
        $('#browser #region small.ALL').text('Transcript');
    }
    let EXON_end = draw_bar('#EXON_bar', data.region_table, UTR = false, EXON = true);
    let domain_end = EXON_end;

    // get max read-count for auto scaling y-axis
    let count_list = [];
    for (const i in data.site_table) {
        for (const j in data.site_table[i]) {
            count_list.push(data.site_table[i][j]['Read Count']);
        }   
    }
    let max_count = Math.max.apply(Math, count_list);

    // site & read-count
    if (data.site_table.length > 1) {
        $('#browser .hint_text').show();
        $('#count1_table').show();
        $('#site2_table').show();
        _draw_site_and_count(data.site_table[0], site_index = 1, count_index = 1, max_count)
        _draw_site_and_count(data.site_table[1], site_index = 2, count_index = 2, max_count)
    } else {
        $('#browser .hint_text').hide();
        $('#count1_table').hide();
        $('#site2_table').hide();
        _draw_site_and_count(data.site_table[0], site_index = 1, count_index = 2, max_count)
    }
}

function draw_bar(target, data, UTR, EXON) {

    function _draw_preprocess(data, UTR, EXON) {

        let da = {};
        let li_key = [];
        let color = [];
        let end = 0;
        let utr5 = 1;
        let utr3 = 1;
        let cds = 1;

        if (UTR == true) {
            for (const i in data) {
                let key = '';
                if (data[i]['region'] == 'UTR5' || data[i]['region'] == "5'UTR") {
                    if (utr5 > 1) key = "5'UTR_" + utr5.toString();
                    else key = "5'UTR";
                    color.push('#B0B0B0');
                    utr5 += 1;
                }
                else if (data[i]['region'] == 'CDS') {
                    if (utr3 > 1) key = "CDS_" + utr3.toString();
                    else key = "CDS";
                    color.push('#00BB00');
                    utr3 += 1;
                }
                else if (data[i]['region'] == 'UTR3' || data[i]['region'] == "3'UTR") {
                    if (cds > 1) key = "3'UTR_" + cds.toString();
                    else key = "3'UTR";
                    color.push('#B0B0B0');
                    cds += 1;
                }
                else continue;
                da[key] = data[i]['length'];
                li_key.push(key);
                end = (end < data[i]['end_pos']) ? data[i]['end_pos'] : end;
            }
        }
        if (EXON == true) {
            for (const i in data) {
                if (data[i]['region'] == 'ALL')
                    color.push('#B0B0B0');
                else if (/exon\d*[02468]$/.test(data[i]['region']))
                    color.push('#FFBD45');
                else if (/exon\d*[13579]$/.test(data[i]['region']))
                    color.push('#FFFF59');
                else continue;
                da[data[i]['region']] = data[i]['length'];
                li_key.push(data[i]['region']);
                end = (end < data[i]['end_pos']) ? data[i]['end_pos'] : end;
            }
        }
        let dat = [da];
        let stack = d3.stack().keys(li_key)
        let stacked_data = stack(dat);
        color = d3.scaleOrdinal().domain(li_key).range(color)

        return [stacked_data, color, end];
    }

    function _drawBarChart(stackedData, color, domain_end, block, UTR) {

        function handleMouseOver(d, i) {
            let pt = d3.pointer(event, svg.node())
            d3.select(this).style('opacity', '0.5')
            let dots = d3.select(this)
            dots.attr('data-tippy-allowHTML', true)
            dots.attr('data-tippy-content', `
                <table class = 'table' style='color:white;'>
                <tr>
                    <th>region</th>
                    <th>length</th>
                    <th>start</th>
                    <th>end</th>
                </tr>
                <tr>
                    <td>${d3.select(this.parentNode).datum().key}</td>
                    <td>${d.target.__data__[1] - d.target.__data__[0]}</td>
                    <td>${d.target.__data__[0] + 1}</td>
                    <td>${d.target.__data__[1]}</td>
                </tr>
                </table>
            `);
            tippy(dots.nodes());
        }

        d3.select(block + ' svg').remove();

        let rwdSvgWidth = parseInt(d3.select(block).node().getBoundingClientRect().width),
            rwdSvgHeight = 65,
            margin = 20,
            marginTop = 10;

        if (UTR) rwdSvgHeight = 30;

        let svg = d3.select(block)
            .append('svg')
            .style('position', 'relative')
            .style('overflow', 'auto')
            .attr('width', rwdSvgWidth)
            .attr('height', rwdSvgHeight);

        let xScale = d3.scaleLinear()
            .domain([1, domain_end])
            .range([margin, rwdSvgWidth - margin]);

        // RWD x-ticks
        let tickNumber = window.innerWidth > 450 ? null : 5;
        xAxis = d3.axisBottom(xScale).ticks(tickNumber);
        if (UTR == false) {
            const xAxisGroup = svg.append("g")
                .call(xAxis)
                .attr("transform", `translate(0,${marginTop + 35})`);
        }

        const bar = svg.append('g')
            .selectAll('g')
            .data(stackedData)
            .join('g')
            .attr('fill', d => color(d.key))
            .selectAll('rect')
            .data(d => d)
            .join('rect')
            .attr("width", d => xScale(d[1]) - xScale(d[0]))
            .attr('x', d => xScale(d[0]))
            .attr('y', marginTop)
            .attr('height', 20)
            .attr("transform", `translate(0,0)`);

        bar.on("mouseover", handleMouseOver)
            .on("mouseleave", handleMouseLeave);
    }

    let values = _draw_preprocess(data, UTR, EXON);
    _drawBarChart(values[0], values[1], values[2], target, UTR);

    return values[2]
}

function draw_count(block, rc, domain_end, up, max_count) {

    function handleMouseOver(d, i) {
        const pt = d3.pointer(event, svg.node())
        d3.select(this)
            .style('opacity', '0.5')
        const dots = d3.select(this)
        dots.attr('data-tippy-allowHTML', true)
        dots.attr('data-tippy-content', d.target.__data__['read_count'])
        tippy(dots.nodes());
    }

    let data_rc = [];
    for (const i in rc) {
        data_rc.push({
            "init_pos": Number(rc[i]['Position'].split('-')[0]),
            "end_pos": Number(rc[i]['Position'].split('-')[1]),
            "read_count": rc[i]['Read Count'],
        });
    }

    d3.select(block + ' svg').remove();

    let rwdSvgWidth = parseInt(d3.select(block).node().getBoundingClientRect().width),
        rwdSvgHeight = 65,
        margin = 20,
        marginTop = 0,
        rc_space = 150;
    rwdSvgHeight = rc_space;

    let height = parseInt(d3.select(block + '_table').node().getBoundingClientRect().height) * 1.4;
    rwdSvgHeight = (rwdSvgHeight < height) ? height : rwdSvgHeight;
    rwdSvgHeight = (data_rc.length == 0) ? 0 : rwdSvgHeight;

    let svg = d3.select(block)
        .append('svg')
        .style('position', 'relative')
        .style('overflow', 'auto')
        .attr('width', rwdSvgWidth)
        .attr('height', rwdSvgHeight);

    let xScale = d3.scaleLinear()
        .domain([1, domain_end])
        .range([margin, rwdSvgWidth - margin])

    let tickNumber = window.innerWidth > 450 ? null : 5;
    xAxis = d3.axisBottom(xScale)
        .ticks(tickNumber)
        .tickSize(-rwdSvgHeight - 100)

    const xAxisGroup = svg.append("g")
        .call(xAxis)
        .attr("transform", `translate(0,${rwdSvgHeight + 100})`)

    const yScale = d3.scaleLinear()
        .domain([0, max_count])
        .range([marginTop, rc_space - 15])
    yAxis = d3.axisLeft(yScale).ticks(tickNumber)

    rc = svg.selectAll('.rect')
        .data(data_rc)
        .enter()
        .append('g')
        .classed('rect', true)

    if (up == true) {
        rc.append("rect")
            .attr("width", d => (xScale(d['end_pos']) - xScale(d['init_pos']) + 1))
            .attr("height", d => yScale(d['read_count']))
            .attr("x", d => xScale(d['init_pos']))
            .attr("y", d => (rwdSvgHeight - yScale(d['read_count'])))
            .attr("fill", "#001253")
    } else {
        rc.append("rect")
            .attr("width", d => (xScale(d['end_pos']) - xScale(d['init_pos']) + 1))
            .attr("height", d => yScale(d['read_count']))
            .attr("x", d => xScale(d['init_pos']))
            .attr("y", 0)
            .attr("fill", "#001253")
    }

    rc.on("mouseover", handleMouseOver)
        .on("mouseleave", handleMouseLeave)
}

function draw_site(block, sites_data, domain_end, up) {

    function handleMouseOver(d, i) {
        const pt = d3.pointer(event, svg.node())
        d3.select(this).style('opacity', '0.5')
        pirna_pos = "";
        pairing_top = "";
        pairing_bottom = "";
        t_head = "";
        t_data = "";
        if (('Read Sequence' in sites_data[0]) && ('Reference Sequence' in sites_data[0])) {
            t_head = 'Alignment Result<br>(top:reference, bottom:read)';
            t_data = d3.select(this).datum()['Alignment'];
        }
        else if ('Read Sequence' in sites_data[0]) {
            t_head = 'Read Sequence';
            t_data = d3.select(this).datum()['Read Sequence'];
        }
        const pirscan_de = d3.select(this)
        pirscan_de.attr('data-tippy-allowHTML', true)
        pirscan_de.attr('data-tippy-maxWidth', 1000)
        pirscan_de.attr('data-tippy-content', `
            <table class='table' style='color: white;'>
            <tr>
                <th>Read ID</th>
                <th>Read Count</th>
                <th>Position</th>
                <th>${t_head}</th>
            </tr>
            <tr>
                <td>${d3.select(this).datum()['Read ID']}</td>
                <td>${d3.select(this).datum()['Read Count']}</td>
                <td>${d3.select(this).datum()['Position']}</td>
                <td style='font-family: monospace;'>${t_data}</td>
            </tr>
            </table>
        `);
        tippy(pirscan_de.nodes());
    }

    let site_table = [];
    let rc_list = []

    for (const i in sites_data) {
        let table = {
            "Read ID": sites_data[i]['Read ID'],
            "Position": sites_data[i]['Position'],
            "strand": sites_data[i]['Strand'],
            "init_pos": Number(sites_data[i]['Position'].split('-')[0]),
            "end_pos": Number(sites_data[i]['Position'].split('-')[1]),
            "Read Count": sites_data[i]['Read Count'],
            "height": sites_data[i]['site_height'],
        }
        if (('Read Sequence' in sites_data[i]) && ('Reference Sequence' in sites_data[i])) {
            if (sites_data[i]['Strand'] == '+')
                table['Alignment'] = `<span class='align_text'>5' ${sites_data[i]['Reference Sequence']} 3'<br>5' ${sites_data[i]['Read Sequence']} 3'</span>`;
            else
                table['Alignment'] = `<span class='align_text'>5' ${sites_data[i]['Reference Sequence']} 3'<br>3' ${sites_data[i]['Read Sequence']} 5'</span>`; 
        }
        else if ('Read Sequence' in sites_data[i]) {
            table['Read Sequence'] = sites_data[i]['Read Sequence'];
        }
        if ('Read Sequence' in sites_data[i]) {
            table['mismatch'] = /[MIDSHX]/.test(sites_data[i]['Read Sequence']);
        } else {
            table['mismatch'] = false;
        }
        site_table.push(table);
        rc_list.push(sites_data[i]['site_height']);
    }

    d3.select(block + ' svg').remove();

    let rwdSvgWidth = parseInt(d3.select(block).node().getBoundingClientRect().width),
        rwdSvgHeight = 65,
        margin = 20,
        marginTop = 5,
        rc_space = 20 * Math.max.apply(Math, rc_list) + 20
    rwdSvgHeight = rc_space + marginTop;
    rwdSvgHeight = (rc_list.length == 0) ? 0 : rwdSvgHeight
    let height = parseInt(d3.select(block + '_table').node().getBoundingClientRect().height) * 1.4
    rwdSvgHeight = (rwdSvgHeight < height) ? height : rwdSvgHeight;

    let svg = d3.select(block)
        .append('svg')
        .style('position', 'relative')
        .style('overflow', 'auto')
        .attr('width', rwdSvgWidth)
        .attr('height', rwdSvgHeight);

    const xScale = d3.scaleLinear()
        .domain([1, domain_end])
        .range([margin, rwdSvgWidth - margin])
    let tickNumber = window.innerWidth > 450 ? null : 5;
    xAxis = d3.axisBottom(xScale)
        .ticks(tickNumber)
        .tickSize(-rwdSvgHeight - 100)

    const xAxisGroup = svg.append("g")
        .call(xAxis)
        .attr("transform", `translate(0,${rwdSvgHeight + 100})`)

    const yScale = d3.scaleLinear()
        .domain([0, Math.max.apply(Math, rc_list)])
        .range([marginTop, rc_space])
    yAxis = d3.axisLeft(yScale).ticks(tickNumber)

    let site = svg.selectAll('.rect')
        .data(site_table)
        .enter()
        .append('g')
        .classed('rect', true)

    if (up == true) {
        site.append("rect")
            .attr("width", d => (xScale(d['end_pos']) - xScale(d['init_pos']) + 1))
            .attr("height", 15)
            .attr("x", d => xScale(d['init_pos']))
            .attr("y", d => rwdSvgHeight - (d['height'] * 20 + 20))
            .attr('fill', d => "#3E6D9C");
    } else {
        site.append("rect")
            .attr("width", d => (xScale(d['end_pos']) - xScale(d['init_pos']) + 1))
            .attr("height", 15)
            .attr("x", d => xScale(d['init_pos']))
            .attr("y", d => (d['height'] * 20 + 5))
            .attr('fill', d => "#3E6D9C");
    }

    site.on("mouseover", handleMouseOver)
        .on("mouseleave", handleMouseLeave);
}

function handleMouseLeave() {
    d3.select(this).style('opacity', '1')
}
