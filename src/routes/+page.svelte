<script>
import { onMount } from 'svelte';
import Tetris from './Tetris';
let canvas;
let ctx;


onMount(()=> {
  const tetris = new Tetris(canvas, canvas.getContext('2d'));
  tetris.loop();
})

</script>

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
</style>
