$(document).ready(function() {
  $('#mobile-controls').css('display', 'none');
/* All the Coffee and Sugar */
  // TODO: Have the Rules and About tabs serve up the appropriate text on the 'testybits' panel when clicked
    $('#play-switch').click(function(event) {

      $('#play-switch').addClass('active');
      $('#about-switch').removeClass('active');
      //$('#mobile-controls').css('display', 'flex');

      $('#how-to-play').css('display', 'none');
      $('.ui.menu').css('display', 'none');

      /* Act on the event */
      game.state.start('main');
    });

    $('#about-switch').click(function(event) {

      $('#about-switch').addClass('active');
      $('#play-switch').removeClass('active');
      $('#info-overlay').removeClass('hidden');

      /* Act on the event */
    });
});
