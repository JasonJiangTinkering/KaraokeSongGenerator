// client-side js
// run by the browser each time your view template is loaded

// by default, you've got jQuery,
// add other scripts at the bottom of index.html

$(function() {
  console.log('hello world :o');
  
  $.get('/dreams', function(dreams) {
    dreams.forEach(function(dream) {
      $('<li></li>').text(dream).appendTo('ul#dreams');
    });
  });
  
  var data = new FormData();
  
  data.append('name', $("#name").val());
  data.append("dream", $("#dream").val());
  $.post(
    "/dream", 
    data, 
    function(data){
    console.log(data);
  }, 
    "multipart/form-data")
  

});
