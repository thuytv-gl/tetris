<script>
import { onMount } from 'svelte';
import Tetris from './Tetris';
let canvas;
let ctx;
let lgt;


onMount(()=> {
    const tetris = new Tetris(canvas, canvas.getContext('2d'));
    tetris.beforeClear = () => {
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);

          lgt.onload = () => {
            // no longer need to read the blob so it's revoked
            URL.revokeObjectURL(url);
          };

          lgt.src = url;
        });
    }
})

</script>


<div style="flex-direction: column; position: absolute; top: 0; left: 10px; font-size: 15px">
<pre>
    left    :   l
    right   :   h
    rotate  :   k
    down    :   j
    drop    :   space
</pre>
    <h4>Last State</h4>
    <img
        width="200"
        height="400"
        bind:this={lgt}
    />
</div>

<div>
    <canvas
        width="400"
        height="800"
        bind:this={canvas}>
    </canvas>
</div>

<style>
div {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin: 0 auto;
}
img {
    margin-right: 10px;
    border: 1px solid pink;
}
</style>
