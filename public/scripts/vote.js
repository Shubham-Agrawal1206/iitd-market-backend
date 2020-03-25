$(document).ready(function(){
    $(".vote-up").submit(function(e){
        e.preventDefault();

        var reviewId = $(this).data("id");
        var courseId = $(this).data("courseid");
        $.ajax({
            type: "PUT",
            url: "http://localhost:3000/course/" + courseId + "/reviews/" + reviewId + "/upvote",
            success: function(data){
                $.ajax({
                    type: "GET",
                    url: "http://localhost:3000/course/" + courseId + "/reviews/" + reviewId + "/votes",
                    success: function(data){
                        $(`#${reviewId}`).html('')
                        $(`#${reviewId}`).append(data)
                    },
                    error: function(err){
                        console.log(err);
                    }
                })
            },
            error: function(a,b,c){
                window.location.replace(window.location.origin+a.responseText); 
            }
        })
    })
    $(".vote-down").submit(function(e){
        e.preventDefault();

        var reviewId = $(this).data("id");
        var courseId = $(this).data("courseid");
        $.ajax({
            type: "PUT",
            url: "http://localhost:3000/course/"+ courseId + "/reviews/" + reviewId + "/downvote",
            success: (data) => {
                $.ajax({
                    type: "GET",
                    url: "http://localhost:3000/course/" + courseId + "/reviews/" + reviewId + "/votes",
                    success: function(data){
                        $(`#${reviewId}`).html('');
                        $(`#${reviewId}`).append(data)
                    },
                    error: function(err){
                        console.log(err);
                    }
                })
            },
            error: function(a,b,c){
                window.location.replace(window.location.origin+a.responseText);
            }
        })
    })
})