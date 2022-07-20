from django.urls import path
from apps.projectM.views import *
from apps.projectM.queue import *
from apps.projectM.downloadf import *

urlpatterns = [
    path('', projectView.as_view()),
    path('info/', updateInfo),
    path('queue/', queueView.as_view()),
    path('queue/queflush/', queflush),
    path('queue/readque/', readque),
    path('queue/queueopt/', queueopt),
    path('queue/addque/', addque),
    path('queue/delque/', delque),
    path('updateC/', updateC),
    path('update_log/', update_log),
    path('getfilelist/', get_filelist),
    path('donwload/', donwload_file),
]