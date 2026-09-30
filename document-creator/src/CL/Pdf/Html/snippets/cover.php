<?php
    $textItems = $this->getElement()->getText();
    $parser = $this->getElement()->accessParser();
    $h = $parser->hPt;
?>

<div class="coverpage">
    <table>
        <tr>
            <td style="height: <?=$h?>pt;">
                <?php foreach($textItems as $i): ?>
                    <?php foreach($i->getLines() as $line): ?>
                        <h1><?= $line ?></h1>
                    <?php endforeach; ?>
                <?php endforeach; ?>
            </td>
        </tr>
    </table>
</div>
