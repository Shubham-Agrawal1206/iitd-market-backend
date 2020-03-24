$('#user-search').on('input', function() {
  var search = $(this).serialize();
  if(search === "search=") {
    search = "all"
  }
  $.get('/users?' + search, function(data) {
    $('#user-grid').html('');
    data.forEach(function(user) {
      if(user.rating === 0){
        $('#user-grid').append(`
        <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
          <div class="card">
            <img class="card-img-top" src="${ user.avatar }">
            <div class="card-body">
              <em>No reviews yet.</em>
              <h5 class="card-title">${ user.username }</h5>
              <a href="/users/${ user._id }" class="btn btn-primary">More Info</a>
            </div>
          </div>
        </div>
      `);
      }else if(user.rating<=1.5){
        $('#user-grid').append(`
        <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
          <div class="card">
            <img class="card-img-top" src="${ user.avatar }">
            <div class="card-body">
              <span class="fa fa-star checked"></span>
              <span class="fa fa-star"></span>
              <span class="fa fa-star"></span>
              <span class="fa fa-star"></span>
              <span class="fa fa-star"></span>
              <h5 class="card-title">${ user.username }</h5>
              <a href="/users/${ user._id }" class="btn btn-primary">More Info</a>
            </div>
          </div>
        </div>
      `);
      }else if(user.rating <=2.5){
        $('#user-grid').append(`
        <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
          <div class="card">
            <img class="card-img-top" src="${ user.avatar }">
            <div class="card-body">
              <span class="fa fa-star checked"></span>
              <span class="fa fa-star checked"></span>
              <span class="fa fa-star"></span>
              <span class="fa fa-star"></span>
              <span class="fa fa-star"></span>
              <h5 class="card-title">${ user.username }</h5>
              <a href="/users/${ user._id }" class="btn btn-primary">More Info</a>
            </div>
          </div>
        </div>
      `);
      }else if(user.rating <= 3.5){
        $('#user-grid').append(`
        <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
          <div class="card">
            <img class="card-img-top" src="${ user.avatar }">
            <div class="card-body">
              <span class="fa fa-star checked"></span>
              <span class="fa fa-star checked"></span>
              <span class="fa fa-star checked "></span>
              <span class="fa fa-star"></span>
              <span class="fa fa-star"></span>
              <h5 class="card-title">${ user.username }</h5>
              <a href="/users/${ user._id }" class="btn btn-primary">More Info</a>
            </div>
          </div>
        </div>
      `);
      }else if(user.rating <=4.5){
        $('#user-grid').append(`
        <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
          <div class="card">
            <img class="card-img-top" src="${ user.avatar }">
            <div class="card-body">
              <span class="fa fa-star checked"></span>
              <span class="fa fa-star checked"></span>
              <span class="fa fa-star checked"></span>
              <span class="fa fa-star checked"></span>
              <span class="fa fa-star"></span>
              <h5 class="card-title">${ user.username }</h5>
              <a href="/users/${ user._id }" class="btn btn-primary">More Info</a>
            </div>
          </div>
        </div>
      `);
      }else{
        $('#user-grid').append(`
        <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
          <div class="card">
            <img class="card-img-top" src="${ user.avatar }">
            <div class="card-body">
              <span class="fa fa-star checked"></span>
              <span class="fa fa-star checked"></span>
              <span class="fa fa-star checked"></span>
              <span class="fa fa-star checked"></span>
              <span class="fa fa-star checked"></span>
              <h5 class="card-title">${ user.username }</h5>
              <a href="/users/${ user._id }" class="btn btn-primary">More Info</a>
            </div>
          </div>
        </div>
      `);
      }
    });
  });
});

$('#user-search').submit(function(event) {
  event.preventDefault();
});