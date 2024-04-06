/* Analysis */

function style_plot(tool, config=null) {
    if (config) {
        $(`#${tool} #theme option[value="${config['theme']}"]`).prop('selected', true);
        $(`#${tool} #format option[value="${config['format']}"]`).prop('selected', true);
        $(`#${tool} #color`).val(config['color']);
    }
    else {
        let style, color, fig_format, style_config;
        style = $(`#${tool} #theme`).find(":selected").val();
        color = $(`#${tool} #color`).val();
        fig_format = $(`#${tool} #format`).find(":selected").val();
        style_config = {
            style: style,
            color: color,
            fig_format: fig_format,
        }
        return style_config
    }
}

function box_plot(tool, config=null) {
    if (config) {
        $(`#${tool} #detail`).prop("checked", config['detail']);
        $(`#${tool} #merge`).prop("checked", config['merge']);
        $(`#${tool} #scale option[value="${config['scale']}"]`).prop('selected', true);
        $(`#${tool} #segmentation option[value="${config['segmentation']}"]`).prop('selected', true);
        $(`#${tool} #test option[value="${config['test']}"]`).prop('selected', true);
        $(`#${tool} #test-format option[value="${config['test-format']}"]`).prop('selected', true);
    }
    else {
        let detail, scale, segmentation, test, test_format, merge, box_config;
        detail = $(`#${tool} #detail`).prop("checked") ? true : false;
        scale = $(`#${tool} #scale`).find(":selected").val();
        segmentation = $(`#${tool} #segmentation`).find(":selected").val();
        test = $(`#${tool} #test`).find(":selected").val();
        test_format = $(`#${tool} #test-format`).find(":selected").val();
        merge = $(`#${tool} #merge`).prop("checked") ? true : false;
        box_config = {
            detail: detail,
            scale: scale,
            segmentation: segmentation,
            test: test,
            test_format: test_format,
            merge: merge,
        }
        return box_config
    }
}

function line_plot(tool, config=null) {
    if (config) {
        $(`#${tool} #merge`).prop("checked", config['merge']);
        $(`#${tool} #segmentation option[value="${config['segmentation']}"]`).prop('selected', true);
    }
    else {
        let merge, segmentation, line_config;
        merge = $(`#${tool} #merge`).prop("checked") ? true : false;
        segmentation = $(`#${tool} #segmentation`).find(":selected").val();
        line_config = {
            merge: merge,
            segmentation: segmentation,
        }
        return line_config
    }
}

function scatter_plot(tool, config=null) {
    if (config) {
        $(`#${tool} #merge`).prop("checked", config['merge']);
        $(`#${tool} #show-others`).prop("checked", config['show-others']);
        $(`#${tool} #scale option[value="${config['scale']}"]`).prop('selected', true);
        $(`#${tool} #segmentation option[value="${config['segmentation']}"]`).prop('selected', true);
        if (config['BCV']!='None') $(`#${tool} #deg`).prop("checked", true);
    }
    else {
        let scale, segmentation, show_others, merge, scatter_config;
        scale = $(`#${tool} #scale`).find(":selected").val();
        segmentation = $(`#${tool} #segmentation`).find(":selected").val();
        show_others = $(`#${tool} #show-others`).prop("checked") ? true : false;
        merge = $(`#${tool} #merge`).prop("checked") ? true : false;
        bcv = $(`#${tool} #deg`).prop("checked") ? 0.1 : 'None';
        scatter_config = {
            scale: scale,
            segmentation: segmentation,
            show_others: show_others,
            merge: merge,
            BCV: bcv,
        }
        return scatter_config
    }
}

function density(config=null) {
    if (config) {
        load_data('density', config);
        $('#density #title').val(config['title']);
        $('#density #reference-text').text(config['reference']);
        box_plot('density', config);
        style_plot('density', config);
    }
    else {
        let data = check_data();

        // run config
        let run_config = { data: data };

        // plot config
        let title = $('#density #title').val();
        let plot_config = {
            data: data,
            filter: group,
            title: title,
        }
        let box_config = box_plot('density');
        let style_config = style_plot('density');
        Object.assign(plot_config, box_config);
        Object.assign(plot_config, style_config);

        return { run_config, plot_config };
    }
}

function metagene(config=null) {
    if (config) {
        load_data('metagene', config);
        $('#metagene #title').val(config['title']);
        $('#metagene #reference-text').text(config['reference']);
        line_plot('metagene', config);
        style_plot('metagene', config);
    }
    else {
        let data = check_data();

        // run config
        let run_config = { data: data };

        // plot config
        let title, plot_config, line_config, style_config;
        title = $('#metagene #title').val();
        plot_config = {
            data: data,
            filter: group,
            title: title,
        }
        line_config = line_plot('metagene')
        style_config = style_plot('metagene')
        Object.assign(plot_config, line_config);
        Object.assign(plot_config, style_config);

        return { run_config, plot_config };
    }
}

function position(tool, config=null) {
    if (config) {
        $(`#${tool} #reference-text`).text(config['reference']);
        $(`#${tool} #title_1`).val(config['title_1']);
        $(`#${tool} #title_2`).val(config['title_2']);
        $(`#${tool} #limit_1`).val(`${config['limit'][0][0]},${config['limit'][0][1]}`);
        $(`#${tool} #limit_2`).val(`${config['limit'][1][0]},${config['limit'][1][1]}`);
        load_data(tool, config);
        line_plot(tool, config);
        style_plot(tool, config);
    }
    else {
        let data = check_data();

        // run config
        let columns, limit_1, limit_2, limit, run_config;
        limit_1 = $(`#${tool} #limit_1`).val().split(',').map(Number);
        limit_2 = $(`#${tool} #limit_2`).val().split(',').map(Number);
        limit = [limit_1, limit_2];
        if (tool == 'boundary')
            columns = ['head', 'tail'];
        else if (tool == 'codon')
            columns = ['start codon', 'stop codon'];
        else columns = [];
        run_config = {
            columns: columns,
            data: data,
            limit: limit,
        }

        // plot config
        let title_1, title_2, plot_config, line_config, style_config;
        title_1 = $(`#${tool} #title_1`).val();
        title_2 = $(`#${tool} #title_2`).val();
        plot_config = {
            data: data,
            filter: group,
            columns: columns,
            title_1: title_1,
            title_2: title_2,
        }
        line_config = line_plot(tool)
        style_config = style_plot(tool)
        Object.assign(plot_config, line_config);
        Object.assign(plot_config, style_config);

        return { run_config, plot_config };
    }
}

function fold(config=null) {
    if (config) {
        load_data('fold', config);
        $('#fold #title').val(config['title']);
        $('#fold #reference-text').text(config['reference']);
        $('#fold #delete-zero').prop("checked", config['delete-zero']);
        box_plot('fold', config);
        style_plot('fold', config);
    }
    else {
        // run config
        let run_config = { data: data.paired };

        // plot config
        let title, delete_zero, plot_config, box_config, style_config;
        title = $('#fold #title').val();
        delete_zero = $('#fold #delete-zero').prop("checked") ? true : false;
        plot_config = {
            data: data.paired,
            filter: group,
            title: title,
            delete_zero: delete_zero,
        }
        box_config = box_plot('fold')
        style_config = style_plot('fold')
        Object.assign(plot_config, box_config);
        Object.assign(plot_config, style_config);

        return { run_config, plot_config };
    }
}

function scatter(config=null) {
    if (config) {
        load_data('scatter', config);
        $('#scatter #title').val(config['title']);
        $('#scatter #reference-text').text(config['reference']);
        scatter_plot('scatter', config);
        style_plot('scatter', config);
    }
    else {
        // run config
        let run_config = { data: data.paired };

        // plot config
        let title, plot_config, scatter_config, style_config;
        title = $('#scatter #title').val();
        plot_config = {
            data: data.paired,
            filter: group,
            title: title,
        }
        scatter_config = scatter_plot('scatter')
        style_config = style_plot('scatter')
        Object.assign(plot_config, scatter_config);
        Object.assign(plot_config, style_config);

        return { run_config, plot_config };
    }
}

function browser(config=null) {
    if (config) {
        load_data('browser', config);
        for (const i of ['1','2']) {
            if (`reference${i}` in config)
                $(`#browser #reference-text${i}`).text(config[`reference${i}`]);
        }
    }
    else {
        return { data: check_data(), group: group };
    }  
}
