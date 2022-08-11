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
    $.ajax({
    type : 'POST',
    url : '/dream',
    data: data,
    processData: false,  // tell jQuery not to process the data
    contentType: false,   // tell jQuery not to set contentType
    success: function(data) {
      if (data == "success"){
        alert("Fountain successfully added!!");
        window.location.reload(true);
      }else {
        alert(data);
      }
    },
    error: function(e) {
     console.log();(e);
    }
    })
  });

});
