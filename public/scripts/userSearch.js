$('#user-search').on('input', function() {
    var search = $(this).serialize();
    if(search === "search=") {
      search = "all"
    }
    $.get('/users?' + search, function(data) {
      $('#user-grid').html('');
      data.forEach(function(user) {
        $('#user-grid').append(`
          <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
            <div class="card">
              <img class="card-img-top" src="${ user.avatar }">
              <div class="card-body">
                <h5 class="card-title">${ user.username }</h5>
                <a href="/users/${ user._id }" class="btn btn-primary">More Info</a>
              </div>
            </div>
          </div>
        `);
      });
    });
  });
  
  $('#user-search').submit(function(event) {
    event.preventDefault();
  });