
<?php use App\core\Config;

footer_libs();?>

<?php App\core\Config::setJsConfig('csrfToken', csrf_token()); ?>
<script>var config = <?= json_encode(App\core\Config::getJsConfig()); ?>;</script>
<script>
    $(document).ready(app.init());

    if (document.forms.length) {
        $("form").prepend("<input type='hidden' name='<?php echo Config::get('csrf.token_name');?>' value='" + config.csrfToken + "' />");
    }

</script>

</body>
</html>
