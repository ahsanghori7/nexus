<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css" integrity="sha384-Vkoo8x4CGsO3+Hhxv8T/Q5PaXtkKtu6ug5TOeNV6gBiFeWPGFN9MuhOf23Q9Ifjh" crossorigin="anonymous">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.min.css">
    <title>Asite Document Error</title>
</head>
<body>
    <div class="core-content">
        <div style="margin: 0 auto; position: relative; width: 500px;" class="holder-404">
            <h1 style="text-align: center;">Asite Document Error</h1>
            <p style="text-align: center;">
                <?php echo isset($message) && $message ? htmlspecialchars($message, ENT_QUOTES, 'UTF-8') : 'We could not load the requested Asite document. Please retry later or contact support.'; ?>
            </p>
        </div>
    </div>
</body>
</html>
