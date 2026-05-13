export function getReloadScript(port: number): string {
  return `
<script>
(function() {
  const socket = new WebSocket('ws://localhost:${port}/live-reload');
  socket.addEventListener('message', function(event) {
    if (event.data === 'reload') {
      location.reload();
    }
  });
  socket.addEventListener('error', function() {
    socket.close();
  });
})();
</script>`;
}
