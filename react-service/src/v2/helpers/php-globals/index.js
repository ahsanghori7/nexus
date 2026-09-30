/*
This function depends on PHP to put a script like this

<script>
    window.reactData = {
        csfr: <?php echo get_the_id(); ?>
    };
</script>

 */
export default function PHPGloblals() {
  let conf;
  try {
    conf = reactData;
  } catch (e) {
    conf = {};
  }
  return conf;
}

export function PHPAppClinkGloblals() {
  let conf;
  try {
    conf = config;
  } catch (e) {
    conf = {};
  }
  return conf;
}
