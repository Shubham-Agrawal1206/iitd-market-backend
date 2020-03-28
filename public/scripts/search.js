$('#course-search').on('input', function() {
  var search = $(this).serialize();
  if(search === "search=") {
    search = "all"
  }
  $.get('/course?' + search, function(data) {
    $('#course-grid').html('');
    data.forEach(function(course) {
      if(course.rating === 0){
        $('#course-grid').append(`
        <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
          <div class="card">
            <img class="card-img-top" src="${ course.image }">
            <div class="card-body">
              <h5 class="card-title">${ course.title }</h5>
              <div class="d-flex justify-content-between align-items-center">
              <small>
                <em>No reviews yet.</em>
              </small>
              <a href="/course/${ course.slug }" class="btn btn-primary">More Info</a>
              </div>
            </div>
          </div>
        </div>
      `);
      }else if(course.rating<=1.5){
        $('#course-grid').append(`
        <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
          <div class="card">
            <img class="card-img-top" src="${ course.image }">
            <div class="card-body">
            <h5 class="card-title">${ course.title }</h5>
            <div class="d-flex justify-content-between align-items-center">
            <small>
              <span class="fa fa-star checked"></span>
              <span class="fa fa-star"></span>
              <span class="fa fa-star"></span>
              <span class="fa fa-star"></span>
              <span class="fa fa-star"></span>
            </small>
              <a href="/course/${ course.slug }" class="btn btn-primary">More Info</a>
              </div>
            </div>
          </div>
        </div>
      `);
      }else if(course.rating <=2.5){
        $('#course-grid').append(`
        <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
          <div class="card">
            <img class="card-img-top" src="${ course.image }">
            <div class="card-body">
            <h5 class="card-title">${ course.title }</h5>
            <div class="d-flex justify-content-between align-items-center">
            <small>
              <span class="fa fa-star checked"></span>
              <span class="fa fa-star checked"></span>
              <span class="fa fa-star"></span>
              <span class="fa fa-star"></span>
              <span class="fa fa-star"></span>
            </small>
              <a href="/course/${ course.slug }" class="btn btn-primary">More Info</a>
              </div>
            </div>
          </div>
        </div>
      `);
      }else if(course.rating <= 3.5){
        $('#course-grid').append(`
        <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
          <div class="card">
            <img class="card-img-top" src="${ course.image }">
            <div class="card-body">
            <h5 class="card-title">${ course.title }</h5>
            <div class="d-flex justify-content-between align-items-center">
            <small>
              <span class="fa fa-star checked"></span>
              <span class="fa fa-star checked"></span>
              <span class="fa fa-star checked "></span>
              <span class="fa fa-star"></span>
              <span class="fa fa-star"></span>
            </small>
              <a href="/course/${ course.slug }" class="btn btn-primary">More Info</a>
              </div>
            </div>
          </div>
        </div>
      `);
      }else if(course.rating <=4.5){
        $('#course-grid').append(`
        <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
          <div class="card">
            <img class="card-img-top" src="${ course.image }">
            <div class="card-body">
            <h5 class="card-title">${ course.title }</h5>
            <div class="d-flex justify-content-between align-items-center">
            <small>
              <span class="fa fa-star checked"></span>
              <span class="fa fa-star checked"></span>
              <span class="fa fa-star checked"></span>
              <span class="fa fa-star checked"></span>
              <span class="fa fa-star"></span>
              </small>
              <a href="/course/${ course.slug }" class="btn btn-primary">More Info</a>
              </div>
            </div>
          </div>
        </div>
      `);
      }else{
        $('#course-grid').append(`
        <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
          <div class="card">
            <img class="card-img-top" src="${ course.image }">
            <div class="card-body">
            <h5 class="card-title">${ course.title }</h5>
            <div class="d-flex justify-content-between align-items-center">
            <small>
              <span class="fa fa-star checked"></span>
              <span class="fa fa-star checked"></span>
              <span class="fa fa-star checked"></span>
              <span class="fa fa-star checked"></span>
              <span class="fa fa-star checked"></span>
            </small>
              <a href="/course/${ course.slug }" class="btn btn-primary">More Info</a>
              </div>
            </div>
          </div>
        </div>
      `);
      }
    });
  });
});

$('#course-search').submit(function(event) {
  event.preventDefault();
});