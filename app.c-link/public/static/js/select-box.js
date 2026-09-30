$(document).ready( function () {

    $('.select-block').click( function() {
        $(this).toggleClass('focus');
        $(this).find('.drop-down-list').delay(10).slideToggle(300);
    });

    $('.select-block .drop-down-list li').click( function() {
       if ($(this).is(':visible')) {
           let id = $(this).data('id');
           let block = $(this).parent().parent().parent();
           $(block).addClass('added').find('.active-list').text($(this).text());
           $(block).find('.list-field').attr('value', id);
       }
    });
});
