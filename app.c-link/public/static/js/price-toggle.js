$(document).ready(function () {

    checked = false;
    price_quarterly_essential = 228;
    price_quarterly_network = 249;
    price_quarterly_comprehensive = 522;

    price_yearly_essential = 182;
    price_yearly_network = 199;
    price_yearly_comprehensive = 419;

    site_url = '<?php echo home_url();?>';

    $("#toggle-1").click(function () {
        if ($(this).prop("checked") == true) {
            $("p[data-quarter]").removeClass("d-none");
            $("p[data-yearly]").addClass("d-none");
            $(".pricing-plan-wrapper button").removeClass("action-btn").addClass("main-btn");
            $(".pricing-plan-wrapper button:eq(0)").attr('onclick', "window.location.href='" + site_url + "/'");
            $(".pricing-plan-wrapper button:eq(1)").attr('onclick', "window.location.href='" + site_url + "/'");
            $(".pricing-plan-wrapper button:eq(2)").attr('onclick', "window.location.href='" + site_url + "/'");
            $(".pricing-plan-wrapper button:eq(3)").attr('onclick', "window.location.href='" + site_url + "/'");
            $(".pricing-plan-wrapper .price:eq(0) .price-swap").html('£' + price_quarterly_essential + ' p/mth*');
            $(".pricing-plan-wrapper .price:eq(1) .price-swap").html('£' + price_quarterly_network + ' p/mth*');
            $(".pricing-plan-wrapper .price:eq(2) .price-swap").html('£' + price_quarterly_comprehensive + ' p/mth*');
        } else {
            $("p[data-quarter]").addClass("d-none");
            $("p[data-yearly]").removeClass("d-none");
            $(".pricing-plan-wrapper button").removeClass("main-btn").addClass("action-btn");
            $(".pricing-plan-wrapper button:eq(0)").attr('onclick', "window.location.href='" + site_url + "/'");
            $(".pricing-plan-wrapper button:eq(1)").attr('onclick', "window.location.href='" + site_url + "/'");
            $(".pricing-plan-wrapper button:eq(2)").attr('onclick', "window.location.href='" + site_url + "/'");
            $(".pricing-plan-wrapper button:eq(3)").attr('onclick', "window.location.href='" + site_url + "/'");
            $(".pricing-plan-wrapper .price:eq(0) .price-swap").html('£' + price_yearly_essential + ' p/mth*');
            $(".pricing-plan-wrapper .price:eq(1) .price-swap").html('£' + price_yearly_network + ' p/mth*');
            $(".pricing-plan-wrapper .price:eq(2) .price-swap").html('£' + price_yearly_comprehensive + ' p/mth*');
        }
    });

})
