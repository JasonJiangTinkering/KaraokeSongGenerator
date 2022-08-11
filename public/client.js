// client-side js
// run by the browser each time your view template is loaded

// by default, you've got jQuery,
// add other scripts at the bottom of index.html

$(function() {
  console.log('hello world :o');
  $('form').submit(function(event) {
    event.preventDefault();
    var data = new FormData();
    var name = $("#name").val()
    var dream = $("#dream").val()
    data.append('name', name);
    data.append("dream", dream);
    $.post(
      "/dream", 
      data, 
      function(data){
      console.log(data);
    }, 
      "multipart/form-data")
  });

});
