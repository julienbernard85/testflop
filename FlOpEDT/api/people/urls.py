# This file is part of the FlOpEDT/FlOpScheduler project.
# Copyright (c) 2017
# Authors: Iulian Ober, Paul Renaud-Goud, Pablo Seban, et al.
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as
# published by the Free Software Foundation, either version 3 of the
# License, or (at your option) any later version.
#
# This program is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
# Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public
# License along with this program. If not, see
# <http://www.gnu.org/licenses/>.
#
# You can be released from the requirements of the license by purchasing
# a commercial license. Buying such a license is mandatory as soon as
# you develop activities involving the FlOpEDT/FlOpScheduler software
# without disclosing the source code of your own applications.
from rest_framework import routers

from api.people import views
import api.preferences.views as views_preferences

routerPeople = routers.SimpleRouter()

routerPeople.register(r"users", views.UsersViewSet)
routerPeople.register(
    r"userdepartmentsettings",
    views.UserDepartmentSettingsViewSet,
    basename="userdepartmentsettings",
)
routerPeople.register(
    r"tutor/username", views.TutorUsernameViewSet, basename="tutor_username"
)
routerPeople.register(r"tutor", views.TutorViewSet, basename="tutor")
routerPeople.register(r"supplystaff", views.SupplyStaffsViewSet, basename="supplystaff")
routerPeople.register(r"students", views.StudentsViewSet, basename="students")
routerPeople.register(
    r"studentsinfo", views.StudentInfoViewSet, basename="student-info"
)
# routerPeople.register(r'coursepreferences', views_preferences.CoursePreferencesViewSet)
