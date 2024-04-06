function toggleSidebar(show, hide) {
    if (show) {
        $(show).find('.nav-link').removeClass('collapsed');
        $(show).find('.nav-content').addClass('show');
        $(show).show();
    }
    if (hide) {
        $(hide).find('.nav-link').addClass('collapsed');
        $(hide).find('.nav-content').removeClass('show');
        $(hide).hide();
    }
}

function change_class(dom, before, after) {
    setTimeout(() => { dom.removeClass(before).addClass(after); }, 100);
}

function tip(target, num=0, reference=false) {
    let instance = tippy(document.querySelector(`${target} #upload-btn`), {
        content: '<i class="bi bi-info-circle"></i> Please select a file.',
        placement: 'bottom',
        theme: 'upload',
        interactive: true,
        allowHTML: true,
    });
    instance.show();
    if (reference) {
        $(window).scrollTop($(`${target} #reference-text`).position().top + num);
    }
    $(`${target} #upload-btn`).on('click', function () {
        instance.destroy();
    });
}

$(document).ready(function () {

    /* Basic Setting */
    // tooltip
    let tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    let tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    })

    // back to top
    $(window).scroll(function () {
        if (window.scrollY > 100) $('.back-to-top').addClass('active');
        else $('.back-to-top').removeClass('active');
    })

    // click header
    for (const item of ['tutorial', 'preprocess', 'analysis', 'database', 'contact']) {
        $(`#header #header_${item}`).on('click', function () {
            let id = this.id.split('_')[1];
            $('.toggle').hide();
            $(`#main #${id}`).show();
            $(`#header .nav-link`).removeClass('active');
            $(this).addClass('active');

            if (item == 'preprocess') {
                $(`#main #overview-pre`).show();
                $('#sidebar .preprocess').show();
                $('#sidebar .analysis').hide();
                $('body').addClass('toggle-sidebar');
                //toggleSidebar(show=$('#sidebar .preprocess'), hide=$('#sidebar .analysis')); 
            }
            else if (item == 'analysis') {
                $(`#main #overview-ana`).show();
                $('#sidebar .preprocess').hide();
                $('#sidebar .analysis').show();
                $('body').addClass('toggle-sidebar');
                //toggleSidebar(show=$('#sidebar .analysis'), hide=$('#sidebar .preprocess'));
            } else {
                $('body').removeClass('toggle-sidebar');
            }
        });
    }

    // click sidebar
    $('.toggle-sidebar-btn').on('click', function () {
        $('body').toggleClass('toggle-sidebar');
    });
    $('#sidebar .toggle_control').on('click', function () {
        let id = this.id.split('_')[1];
        $('.toggle').hide();
        $(`#main #${id}`).show();
    });

    // click To-Workflow
    $('.to_workflow').on('click', function () {
        $('#header #header_preprocess').trigger('click');
        $('#sidebar #sidebar_workflow').trigger('click');
    });

    // click To-Utility
    $('.to_utility').on('click', function () {
        $('#header #header_preprocess').trigger('click');
        $('#sidebar #sidebar_utility').trigger('click');
    });

    /* Preprocess Setting */
    // toggle example
    $('#workflow #ex_btn').on('click', function () {
        $('#workflow #ex').fadeToggle()
    });
    $('#utility #ex_btn1').on('click', function () {
        $('#utility #ex1').fadeToggle()
    });
    $('#utility #ex_btn2').on('click', function () {
        $('#utility #ex2').fadeToggle()
    });
    
    // workflow accordion CSS
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

    // workflow checkbox
    for (const tool of ['trimming','normalization','mapping']) {
        $(`#workflow #${tool} #active`).on('change', function () {
            if (this.checked)
                $(`#workflow #${tool}-body`).find("input, select").prop("disabled", false);
            else
                $(`#workflow #${tool}-body`).find("input, select").prop("disabled", true);
        });
    }

    // workflow normalization strategy
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

    // workflow mapping filter
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

    // workflow bowtie2
    $('#workflow #normalization .bowtie2').hide();
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

    // utility checkbox
    for (const tool of ['field','map','filter','read','merge_field','normalize_field']) {
        $(`#utility #${tool}_check`).on('change', function () {
            if (this.checked) {
                $(`#utility #${tool}`).show();
            }
            else {
                $(`#utility #${tool}`).hide();
            }
        });
    }

    // utility normalize
    $('#utility #normalize').on('change', function () {
        if ($(this).val() == 'Factor')
            $(`#utility .norm_factor`).show();
        else
            $(`#utility  .norm_factor`).hide();
    });

});