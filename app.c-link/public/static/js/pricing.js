$(document).ready(function () {

    $(".pricing-plan-wrapper button").click(function () {
        var plan = $(this).data('plan');
        var interval = $(this).data('interval');
        if(!interval){
            interval = 'yearly';
        }
        window.location.href = `/sign-up?plan=${plan}&interval=${interval}`;
    });

    var price = {
        yearly: {
            essential: 182,
            network: 199,
            comprehensive: 419,
            message: '*Billed annually'
        },
        quarterly: {
            essential: 228,
            network: 249,
            comprehensive: 522,
            message: '*Billed quarterly with one year commitment'
        }
    }

    $("#toggle-1").click(function () {

        const checked = ($(this).prop("checked") === true);
        var interval = checked ? "quarterly" : "yearly";

        $(".pricing-plan-wrapper button").data('interval', interval);

        $(".pricing-plan-wrapper").removeClass(checked ? "yearly" : "quarterly").addClass(interval);
        $(".pricing-plan-wrapper button").removeClass(checked ? "action-btn" : "main-btn").addClass(checked ? "main-btn" : "action-btn").fadeIn(700);
        $(".pricing-plan-wrapper .price:eq(0) .price-swap").hide().html('£' + price[interval].essential + ' p/mth*').fadeIn(700);
        $(".pricing-plan-wrapper .price:eq(1) .price-swap").hide().html('£' + price[interval].network + ' p/mth*').fadeIn(700);
        $(".pricing-plan-wrapper .price:eq(2) .price-swap").hide().html('£' + price[interval].comprehensive + ' p/mth*').fadeIn(700);
        $(".text-change").hide().text(price[interval].message).fadeIn(700);

    });
})
