$(document).ready(function(){
    $(".vote-up").submit(function(e){
        e.preventDefault();
        var reviewId = $(this).data("id");
        var userSlug = $(this).data("userslug");
        $.ajax({
            type: "PUT",
            url: window.location.origin + "/users/" + userSlug + "/reviews/" + reviewId + "/upvote",
            error: function(a,b,c){
                console.log(a,b,c);
                window.location.replace(window.location.origin+a.responseText);
            },
            success: function(data){
                $.ajax({
                    type: "GET",
                    url: window.location.origin + "/users/" + userSlug + "/reviews/" + reviewId + "/votes",
                    success: function(data){
                        $(`#${reviewId}`).html('')
                        $(`#${reviewId}`).append(data)
                    },
                    error: function(err){
                        console.log(err);
                    }
                })        
            }
        })
    })
    $(".vote-down").submit(function(e){
        e.preventDefault();

        var reviewId = $(this).data("id");
        var userSlug = $(this).data("userslug");
        $.ajax({
            type: "PUT",
            url: window.location.origin + "/users/"+ userSlug + "/reviews/" + reviewId + "/downvote",
            error: function(a,b,c){
                console.log(a,b,c);
                window.location.replace(window.location.origin+a.responseText);
            },
            success: function(data){
                $.ajax({
                    type: "GET",
                    url: window.location.origin + "/users/" + userSlug + "/reviews/" + reviewId + "/votes",
                    success: function(data){
                        $(`#${reviewId}`).html('')
                        $(`#${reviewId}`).append(data)
                    },
                    error: function(err){
                        console.log(err);
                    }
                })        
            }
        })
    })
})