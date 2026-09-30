<?php
    $sentry = config('tools.sentry');
    if ($sentry["enabled"]):
        if ($sentry["dns"] && $sentry["integrity"]):

            $dns = $sentry["dns"];
            $integrity = $sentry["integrity"];
            $traces = $sentry["traces"] ?? "1.0";

            ?>

            <script
                src="https://browser.sentry-cdn.com/5.27.2/bundle.tracing.min.js"
                integrity="<?php echo $integrity; ?>"
                crossorigin="anonymous"
            ></script>
            <script>
                Sentry.init({
                    dsn: '<?php echo $dns; ?>',
                    tracesSampler: <?php echo $traces; ?>,
                    integrations: [
                        new Sentry.Integrations.BrowserTracing()
                    ]
                });
            </script>
        <?php
        endif;
    endif;
?>
