from django.shortcuts import render

def echo(request):
    """
    Render the index page of the Echo app.
    """
    return render(request, 'echo.html')


def profile_page(request):
    user = request.user
    return render(request, 'profile.html', {
        'username': user.nickname,
        'avatar_url': user.avatar.url if user.avatar else '',
    })
