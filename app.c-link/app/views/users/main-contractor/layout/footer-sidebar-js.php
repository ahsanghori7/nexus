<script type="text/javascript">

    $(function () {
        $('[data-toggle="popover"]').popover();
    })


    $('.area-expand').click(
        function () {
            const responsive = window.matchMedia('(max-width: 1199px)').matches;
            const open = $(this).hasClass('active');

            let collapsedMenu = '280px';
            let openedMenu = '90px';

            let sideBarMargin = collapsedMenu;

            function menuClosed() {
                $('.c-sidebar').removeClass('active');
                $('.icon-text').css('display', 'none');
                $('.collapse-menu-text').css('display', 'none');
                $('.dash-nav .area-expand img').css('transform', 'rotate(180deg)');
            }

            function menuOpen() {
                $('.c-sidebar').addClass('active');
                $('.icon-text').css('display', 'block');
                $('.collapse-menu-text').css('display', 'block');
                $('.dash-nav .area-expand img').css('transform', 'rotate(0deg)');
            }

            menuClosed();

            if (!responsive) {
                if (!open) {
                    sideBarMargin = openedMenu;
                } else {
                    menuOpen();
                }
            } else {
                menuOpen();
                if (open) {
                    sideBarMargin = openedMenu;
                    menuClosed();
                }
            }

            $(this).toggleClass('active');

            $('.c-main').animate(
                {marginLeft: sideBarMargin},
                700
            );
            $('.c-sidebar').animate(
                {
                    width: sideBarMargin
                },
                700,
            );

        }
    );

    $(document).mouseup(function (e) {
        const responsive = window.matchMedia('(max-width: 1199px)').matches;
        const open = $('.area-expand').hasClass('active');
        let container = $(".c-sidebar");

        if (!responsive || !open) {
            return;
        }

        if (!container.is(e.target) &&
            container.has(e.target).length === 0) {
            $('.c-sidebar').animate(
                {
                    left: '-270px'
                },
                700,
            );
            $('.area-expand').toggleClass('active');
        }
    });

</script>
