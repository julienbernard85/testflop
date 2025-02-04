const popoverAllowList = bootstrap.Tooltip.Default.allowList;
popoverAllowList.button = [];
popoverAllowList['*'].push('onclick');

const list_close = new Event('list-close');

// usefull_translations
let paramaters_translation=[gettext("time2"), gettext("nb_max"), gettext("weekdays"), gettext("nb_min"),
    gettext("If a tutor has 2 or 4 courses only, join it?"), gettext("slot_start_time"), gettext("curfew_time"), gettext("weeks"),
    gettext("slot_end_time"), gettext("max_number"), gettext("max_holes_per_day"), gettext("train_progs"),
    gettext("max_holes_per_week"), gettext("limit"), gettext("min_time_per_period"), gettext("max_time_per_period"),
    gettext("course_type"), gettext("max_hours"), gettext("fhd_period"), gettext("tolerated_margin"),
    gettext("number_of_weeks"), gettext("guide_tutors"), gettext("min_days_nb"), gettext("lower_bound_hours"),
    gettext("work_copy"), gettext("fixed_days"), gettext("module"), gettext("tutor"), gettext("group"),
    gettext("possible_rooms"), gettext("start_lunch_time"), gettext("end_lunch_time"), gettext("fampm_period"),
    gettext("weekday"), gettext("lunch_length"), gettext("min_break_length"), gettext("tutor_status"),
    gettext("course_types"), gettext("possible_week_days"), gettext("groups"), gettext("tutors"),
    gettext("modules"), gettext("possible_start_times"), gettext("forbidden_week_days"),
    gettext("forbidden_start_times"), gettext("pre_assigned_only"), gettext("percentage"), gettext("time1"),
    gettext("room_type"), gettext("room_types"), gettext('transversal_groups_included'),
    gettext('Can combine two groups if no tutor'), gettext('Desired busy slots duration'),
    gettext('min_hours')]


//should/could be replaced by django-js-choices
let choices = {
    'AM': gettext('AM'),
    'PM': gettext('PM'),
    'fd': gettext('fd'),
    'hd': gettext('hd'),
    'm': gettext('m'),
    'tu': gettext('tu'),
    'w': gettext('w'),
    'th': gettext('th'),
    'f': gettext('f'),
    'sa': gettext('sa'),
    'su': gettext('su'),
}


// helper function to extract a parameter object from a given constraint
let get_parameter_from_constraint = (cst, name) => {
    let ret = {};
    let l = cst.parameters.filter(obj => obj['name'] === name);
    return l.length === 0 ? ret : l[0];
};

let htmlElements = {
    iconWeight: document.getElementById('icon-weight'),
    iconGears: document.getElementById('icon-gears'),
    iconCheck: document.getElementById('icon-check'),
    newConstraintButton: document.getElementById('nav-new-constraint'),
    constraintsGroupMode: document.getElementById('constraints-group-mode'),
    constraintsSelectAll: document.getElementById('constraints-select-all'),
    paramsDiv: document.getElementById('params'),
    constraintsEditPopup: document.getElementById('constraint-edit-popup'),
    constraintEditTitle: document.getElementById('constraint-edit-title'),
    constraintEditComment: document.getElementById('constraint-edit-comment'),
    constraintEditType: document.getElementById('constraint-edit-type'),
    constraintEditParams: document.getElementById('constraint-edit-params'),
    constraintEditWeightSlider: document.getElementById('constraint-edit-weight-slider'),
    constraintEditWeightValue: document.getElementById('constraint-edit-weight-value'),
    constraintEditActivation: document.getElementById('constraint-edit-activation'),
    constraintEditAlert: document.getElementById('constraint-edit-alert-container'),
    enabledConstraintsList: document.getElementById('constraints-enabled'),
    disabledConstraintsList: document.getElementById('constraints-disabled'),
    filtersElement: document.getElementById('filters'),
    filterSearch: document.getElementById('input-search'),
    filterTutor: document.getElementById('filter-tutor'),
    filterTutorList: document.getElementById('filter-tutor-list'),
    filterGroup: document.getElementById('filter-group'),
    filterAllWeeks: document.getElementById('filter-all-weeks'),
    showInactiveConstraints: document.getElementById('show-inactive-constraints'),
    numberSelectedConstraints: document.getElementById('num-selected-constraints'),
    commitChangesButton: document.getElementById('apply-changes'),
    fetchConstraintsButton: document.getElementById('fetch-constraints'),
    clearFiltersButton: document.getElementById('clear-filters'),
    cancelEditConstraintButton: document.getElementById('cancel-edit-constraint'),
    confirmEditConstraintButton: document.getElementById('confirm-edit-constraint'),
    selectedConstraintsEditWeightSlider: document.getElementById('selected-constraints-edit-weight-slider'),
    selectedConstraintsEditWeightButton: document.getElementById('selected-constraints-edit-weight'),
    selectedConstraintsDeleteButton: document.getElementById('selected-constraints-delete'),
    messagesBanner: document.getElementById('messages'),
};

htmlElements.filterSearch.oninput = () => {
    filter.by_search(htmlElements.filterSearch.value);
    filter.reapply();
};

const State = Object.freeze({
    Nothing: Symbol('nothing'),
    CreateNewConstraint: Symbol('create'),
    EditConstraint: Symbol('edit'),
});

let currentState = State.Nothing;

let setState = (newState) => {
    if (!Object.entries(State).find(entry => entry[1] === newState)) {
        return;
    }
    currentState = newState;
};

let currentPopover;

let currentSelectList = {
    list: null,
    input: null,
    index: -1,
    _elements_list: [],
    reset: (newList = null, newInput = null) => {
        currentSelectList.list = newList;
        currentSelectList.index = -1;
        currentSelectList.input = newInput;
        if (newList) {
            let list_id = newList.id;
            currentSelectList._elements_list = document.getElementById(list_id).children;
        }
    },
    _entry_changed: (previous_index, next_index) => {
        if (next_index >= currentSelectList._elements_list.length) {
            return;
        }

        if (previous_index >= 0) {
            currentSelectList._elements_list[previous_index].classList.remove('active');
        }
        let next = currentSelectList._elements_list[next_index];
        next.classList.add('active');
        document.getElementById(next.id).scrollIntoView({
            behavior: 'auto',
            block: 'nearest',
            inline: 'nearest',
        });
    },
    previous_entry: () => {
        if (currentSelectList.index > 0) {
            currentSelectList._entry_changed(currentSelectList.index, --currentSelectList.index);
        }
    },
    next_entry: () => {
        if (currentSelectList.index < currentSelectList._elements_list.length - 1) {
            currentSelectList._entry_changed(currentSelectList.index, ++currentSelectList.index);
        }
    },
    press_entry: () => {
        let index = currentSelectList.index;
        if (index >= 0 && index <= currentSelectList._elements_list.length - 1) {
            let entry = currentSelectList._elements_list[index];
            entry.onclick();
        }
    },
    close: () => {
        if (!currentSelectList.list) {
            return;
        }
        currentSelectList.list.dispatchEvent(list_close);
    },
};

// object containing functions that involve filtering
let filter = {
    current: {
        search: '',
        tutor: null,
        group: null,
        week: null,
    },
    reset: () => {
        filtered_constraint_list = [...constraint_list];
    },
    by_search: search => {
        filter.current.search = search;

        if (search.length === 0) {
            // No search text provided so not filtered
            return;
        }

        search = search.toLowerCase()

        filtered_constraint_list = filtered_constraint_list.filter(pageid => {
            let constraint = constraints[pageid];
            let name = (constraint.title ?? database.constraint_types[constraint.name].local_name).toLowerCase();
            let comment = (constraint.comment ?? '').toLowerCase();
            return name.includes(search) || comment?.includes(search);
        });
    },
    by_tutor: tutorID => {
        filter.current.tutor = tutorID;

        if (tutorID === null) {
            // No tutor provided so not filtered
            return;
        }

        tutorID = '' + tutorID;

        // Filter the constraints with the search
        filtered_constraint_list = filtered_constraint_list.filter(pageid => {
            let constraint = constraints[pageid];

            // Keep only constraints having a 'tutors' parameter
            let paramTutor = constraint.parameters.find(
                (parameter) => parameter.name === 'tutors'
            );
            if (!paramTutor) {
                return false;
            }

            // If no tutor selected then all tutors are concerned
            if (paramTutor.id_list.length === 0) {
                return true;
            }

            // Keep the constraint if one of their tutors matches the provided ID
            return paramTutor.id_list.includes(tutorID);
        });
    },
    by_week: week_id => {
        filter.current.week = week_id;

        if (week_id === null) {
            // No week provided so not filtered
            return;
        }

        filtered_constraint_list = filtered_constraint_list.filter(pageid => {
            if (!(pageid in constraints)) {
                return false;
            }
            let param = constraints[pageid].parameters.find(parameter => parameter.name === 'weeks');
            return (param.id_list.length === 0 || param.id_list.includes('' + week_id));
        });
    },
    by_group: groupID => {
        filter.current.group = groupID;

        if (groupID === null) {
            // No module provided so not filtered
            return;
        }

        groupID = '' + groupID;

        // Filter the constraints with the search
        filtered_constraint_list = filtered_constraint_list.filter(pageid => {
            let constraint = constraints[pageid];

            // Keep only constraints having a 'groups' parameter with at least one tutor
            let paramGroup = constraint.parameters.find(parameter => parameter.name === 'groups');
            if (!paramGroup || paramGroup.id_list.length === 0) {
                return false;
            }

            // Keep the constraint if one of their groups matches the provided ID
            return paramGroup.id_list.includes(groupID);
        });
    },
    reapply: () => {
        filter.reset();
        filter.by_week(filter.current.week);
        filter.by_search(filter.current.search);
        filter.by_tutor(filter.current.tutor);
        filter.by_group(filter.current.group);
        refreshConstraints();
    },
};

let visibility = {
    setElementVisible: (htmlElement, isVisible) => {
        htmlElement.hidden = !isVisible;
    },
    showPopover: (popover) => {
        if (!popover) {
            return;
        }
        if (currentPopover !== popover) {
            // Hide previous popover
            visibility.hidePopover();
        }
        currentPopover = popover;
        popover.show();
    },
    hidePopover: _ => {
        if (currentPopover) {
            currentPopover.dispose();
            currentPopover = null;
        }
    },
};

// object containing event listeners for constraint management (to prepare for the request)
let changeEvents = {
    addNewConstraint: (constraint) => {
        constraints[constraint.pageid] = constraint;
        actionChanges.add[constraint.pageid] = constraint;
        constraint_list = Object.keys(constraints);
        filter.reapply();
    },
    deleteConstraint: (pageid) => {
        let constraint = constraints[pageid];
        if (!constraint) {
            console.log(`Constraint not found for deletion: ${pageid}`);
            return;
        }

        delete constraints[pageid];

        // Check if the constraint is already in the database
        if (!actionChanges.add[pageid]) {
            // Register it for removal
            actionChanges.delete[pageid] = constraint;
        }

        // Remove the constraint from being added or edited
        delete actionChanges.add[pageid];
        delete actionChanges.edit[pageid];

        constraint_list = Object.keys(constraints);
        selected_constraints = selected_constraints.filter(id => id !== pageid);
        filter.reapply();
    },
    editConstraint: (constraint) => {
        constraints[constraint.pageid] = constraint;

        // Check if the constraint has just been added
        if (actionChanges.add[constraint.pageid]) {
            // Directly edit the constraint in the add list
            actionChanges.add[constraint.pageid] = constraint;
            return;
        }
        // Else add the changes in the edit list (or replace if existing)
        actionChanges.edit[constraint.pageid] = constraint;
    },
    normalizeActionChanges: () => {
        // If the changes are stored as diffs (like a version control system),
        // this function cumulates the diffs before committing.
    },
    commitChanges: async () => {
        let toAdd = Object.values(actionChanges.add);
        let toEdit = Object.values(actionChanges.edit);
        let toDelete = Object.values(actionChanges.delete);
        if (toAdd.length === 0 && toEdit.length === 0 && toDelete.length === 0) {
            console.log('Nothing to commit');
            return;
        }

        let success = true;

        let failed = (constraint, reason) => {
            let message = `Constraint ${constraint.pageid} could not be saved for the following reasons:`;
            Object.keys(reason).forEach(key => {
                message += `\n${key}: ${reason[key]}`;
            });
            console.error(message);
            alertMessage.error(message);
            alertMessage.error(message);
            success = false;
        };

        // Send new constraints
        await Promise.all(toAdd.map(async (constraint) => {
            constraint.department = department;
            await postData(urlConstraint, constraint).then(r => console.log(r), reason => {
                failed(constraint, reason);
            });
        }));

        // Send existing constraints updates
        await Promise.all(toEdit.map(async (constraint) => {
            constraint.department = department;
            await putData(urlConstraint, constraint).then(r => console.log(r), reason => {
                failed(constraint, reason);
            });
        }));

        // Send constraint deletions
        await Promise.all(toDelete.map(async (constraint) => {
            await deleteData(urlDetailConstraint, {
                'name': constraint.name,
                'id': constraint.id
            }).then(r => console.log(r), reason => {
                failed(constraint, reason);
            });
        }));

        if (success) {
            // Reset changes as everything has been accepted
            resetActionChanges();
            // Reload the constraints (new constraints can have different IDs when inserted)
            fetchers.fetchConstraints();
            alertMessage.clearAll();
            alertMessage.success(gettext('All changes have been saved.'));
        }
    },
}


// convert floptime to readable time for labels
function floptime_to_str_time(floptime){
    let min_from_midnight= parseInt(floptime)
    let minutes = min_from_midnight%60
    let hours = (min_from_midnight - minutes) /60
    let str_minutes = "0" + minutes.toString()
    let str_hours = hours.toString()
    let formattedTime = str_hours + ':' + str_minutes.substr(-2)
    return formattedTime
}


// object containing functions that fetch data from the database
let fetchers = {
    fetchAcceptableValues: (e) => {
        fetch(build_url(urlAcceptableValues, {'dept': department}))
            .then(resp => resp.json())
            .then(jsonObj => {
                database['acceptable_values'] = {};
                Object.values(jsonObj).forEach(obj => {
                    database['acceptable_values'][obj['name']] = obj;
                });
            })
            .catch(err => {
                console.error('something went wrong while fetching acceptable values');
                console.error(err);
            });
    },
    fetchConstraints: (e) => {
        emptyPage();
        fetchers.fetchAcceptableValues();
        fetch(build_url(urlConstraints, {'dept': department}))
            .then(resp => resp.json())
            .then(jsonObj => {
                originalConstraints = responseToDict(Object.values(jsonObj));
                constraints = copyFromOriginalConstraints();
                Object.values(constraints).forEach((constraint) => {
                    constraint.parameters.forEach((param) => {
                        if (param.name in database.acceptable_values) {
                            param.acceptable = database.acceptable_values[param.name].acceptable;
                        }
                        param.id_list = param.id_list.map(String);
                    });
                });
                actionChanges = emptyChangesDict();
                selected_constraints = [];
                lastSelectedConstraint = null;
                constraint_list = Object.keys(constraints);
                selected_week = getWeek(year_init, week_init).id;
                filter.by_week(selected_week);
                filter.reapply();
            })
            .catch(err => {
                console.error('something went wrong while fetching constraints');
                console.error(err);
            });
    },
    fetchDepartments: (e) => {
        fetch(build_url(urlDepartments))
            .then(resp => resp.json())
            .then(jsonObj => {
                database['departments'] = jsonObj.reduce((obj, next) => {
                    let id = next['id'].toString();
                    let abbrev = next['abbrev'];
                    let ret = obj;
                    ret[id] = abbrev;
                    return ret;
                }, {})
            })
            .catch(err => {
                console.error('something went wrong while fetching departments');
                console.error(err);
            });
    },
    fetchTrainingPrograms: (e) => {
        fetch(build_url(urlTrainingPrograms, {'dept': department}))
            .then(resp => resp.json())
            .then(jsonObj => {
                database['train_progs'] = {};
                Object.values(jsonObj).forEach(obj => {
                    database['train_progs'][obj['id']] = obj;
                });
            })
            .catch(err => {
                console.error('something went wrong while fetching training programs');
                console.error(err);
            });
    },
    fetchStructuralGroups: (e) => {
        fetch(build_url(urlGroups, {'dept': department}))
            .then(resp => resp.json())
            .then(jsonObj => {
                database['groups'] = {};

                htmlElements.filterGroup.innerHTML = '';
                let option = elementBuilder('option', {
                    'value': -1,
                });
                option.text = gettext('All groups');
                option.onclick = () => {
                    filter.by_group(null);
                    filter.reapply();
                };
                htmlElements.filterGroup.append(option);
                Object.values(jsonObj).forEach(obj => {
                    database['groups'][obj.id] = obj;

                    option = elementBuilder('option', {
                        'value': obj.id,
                    });
                    option.innerText = `${obj.train_prog}-${obj.name}`;
                    option.onclick = () => {
                        filter.by_group(obj.id);
                        filter.reapply();
                    };
                    htmlElements.filterGroup.append(option);
                });
            })
            .catch(err => {
                console.error('something went wrong while fetching structural groups');
                console.error(err);
            });
    },
    fetchTutors: (e) => {
        fetch(build_url(urlTutors, {'dept': department}))
            .then(resp => resp.json())
            .then(jsonObj => {
                database['tutors'] = {};
                Object.values(jsonObj).forEach(obj => {
                    database['tutors'][obj['username']] = obj;
                });
                htmlElements.filterTutor.querySelector('input').value = '';
            })
            .catch(err => {
                console.error('something went wrong while fetching tutors');
                console.error(err);
            });
    },
    fetchModules: (e) => {
        fetch(build_url(urlModules, {'dept': department}))
            .then(resp => resp.json())
            .then(jsonObj => {
                database['modules'] = {};
                Object.values(jsonObj).forEach(obj => {
                    database['modules'][obj['id']] = obj;
                });
            })
            .catch(err => {
                console.error('something went wrong while fetching modules');
                console.error(err);
            });
    },
    fetchCourseTypes: (e) => {
        fetch(build_url(urlCourseTypes, {'dept': department}))
            .then(resp => resp.json())
            .then(jsonObj => {
                database['course_types'] = {};
                Object.values(jsonObj).forEach(obj => {
                    database['course_types'][obj['id']] = obj['name'];
                });
            })
            .catch(err => {
                console.error('something went wrong while fetching course types');
                console.error(err);
            });
    },
    fetchRoomTypes: (e) => {
        fetch(build_url(urlRoomTypes, {'dept': department}))
            .then(resp => resp.json())
            .then(jsonObj => {
                database['room_types'] = {};
                Object.values(jsonObj).forEach(obj => {
                    database['room_types'][obj['id']] = obj['name'];
                });
            })
            .catch(err => {
                console.error('something went wrong while fetching room types');
                console.error(err);
            });
    },
    fetchCourses: (e) => {
        fetch(build_url(urlCourses, {'dept': department}))
            .then(resp => resp.json())
            .then(jsonObj => {
                database['courses'] = {};
                Object.values(jsonObj).forEach(obj => {
                    database['courses'][obj['id']] = obj;
                });
            })
            .catch(err => {
                console.error('something went wrong while fetching courses');
                console.error(err);
            });
    },
    fetchWeeks: (e) => {
        fetch(urlWeeks)
            .then(resp => resp.json())
            .then(jsonObj => {
                database['weeks'] = {};
                Object.values(jsonObj).forEach(obj => {
                    let currentYear = new Date().getFullYear();
                    let year = obj['year'];
                    if (year < currentYear - 1 || year > currentYear + 1) {
                        return;
                    }
                    database['weeks'][obj['id']] = obj;
                });
            })
            .catch(err => {
                console.error('something went wrong while fetching weeks');
                console.error(err);
            });
    },
    fetchRooms: (e) => {
        fetch(build_url(urlRooms, {'dept': department}))
            .then(resp => resp.json())
            .then(jsonObj => {
                database['rooms'] = {};
                Object.values(jsonObj).forEach(obj => {
                    database['rooms'][obj['id']] = obj;
                });
            })
            .catch(err => {
                console.error('something went wrong while fetching courses');
                console.error(err);
            });
    },
    fetchTutorsIDs: (e) => {
        fetch(build_url(urlTutorsID, {'dept': department}))
            .then(resp => resp.json())
            .then(jsonObj => {
                database['tutors_ids'] = {};
                Object.values(jsonObj).forEach(obj => {
                    database['tutors_ids'][obj['id']] = obj;
                });
            })
            .catch(err => {
                console.error('something went wrong while fetching tutors_ids');
                console.error(err);
            });
    },
    fetchConstraintTypes: (e) => {
        fetch(build_url(urlConstraintTypes, {'dept': department}))
            .then(resp => resp.json())
            .then(jsonObj => {
                database.constraint_types = {};
                let constraints = Object.values(jsonObj).sort((a, b) => a.local_name.toString().localeCompare(b.local_name.toString()));

                constraints.forEach(constraint => {
                    database.constraint_types[constraint.name] = constraint;
                    // fill the types in type selection
                    let option = elementBuilder('option', {});
                    option.text = constraint.local_name.toString();
                    htmlElements.constraintEditType.add(option);
                });
            })
            .catch(err => {
                console.error('something went wrong while fetching constraint types');
                console.error(err);
            });
    },
}

// transform DB response to a JSON object
let responseToDict = (resp) => {
    let ret = {};
    resp.forEach(cst => {
        let id = cst['name'] + cst['id'];
        ret[id] = cst;
        ret[id]['pageid'] = id;
    })
    return ret;
}

// returns week object from week and year numbers
let getWeek = (year, week) => {
    return Object.values(database.weeks).find(week_object => {
        return (week_object.nb === week && week_object.year === year);
    })
};

// a simple way to make a copy of a JSON object
let copyObj = (obj) => {
    return JSON.parse(JSON.stringify(obj));
}

// toggle the tab for disabled constraints
let onChangeInactiveConstraintsFilter = (e) => {
    htmlElements.disabledConstraintsList.style.display = htmlElements.showInactiveConstraints.checked ? 'block' : 'none';
}

// returns a copy of the original constraints
let copyFromOriginalConstraints = () => {
    let copy = copyObj(originalConstraints);
    return copy;
}

// helper random integer generator function
let getRandomInt = (max) => {
    return Math.floor(Math.random() * max);
}

// constraint clicked simulator
let clickConstraint = (id) => {
    document.getElementById('constraints-all').querySelector(`.constraint-card[cst-id=${id}]`).children[0].click();
}

// returns an empty JSON object for tracking changes on constraints
let emptyChangesDict = () => {
    return {
        'add': {},
        'delete': {},
        'edit': {},
    };
}

// some variable assignments
let originalConstraints;
let constraints;
let newConstraint;
let editConstraint;
let actionChanges;
let resetActionChanges = () => {
    actionChanges = emptyChangesDict();
};
resetActionChanges();

let database = {
    'departments': null,
    'train_progs': null,
    'groups': null,
    'tutors': null,
    'tutors_ids': null,
    'modules': null,
    'course_types': null,
    'room_types': null,
    'courses': null,
    'weeks': null,
    'acceptable_values': null,
    'constraint_types': null,
}


let findConstraintClassFromLocalName = (localName) => {
    return Object.values(database.constraint_types).find(obj => {
        return obj.local_name.trim() === localName.trim();
    });
};

let findConstraintLocalNameFromClass = (className) => {
    return database.constraint_types[className].local_name;
};


let getNewConstraintID = (className) => {
    let filteredByClassName = Object.values(constraints).filter(constraint => constraint.name === className);
    if (filteredByClassName.length === 0) {
        return 1;
    }

    // Extract each constraint's pageid their number and return the max + 1
    return parseInt(filteredByClassName.reduce((constraint1, constraint2) => {
        let cst1 = constraint1.pageid.match(/\d+/)[0];
        let cst2 = constraint2.pageid.match(/\d+/)[0];
        return (cst1 > cst2 ? constraint1 : constraint2);
    }, filteredByClassName[0]).pageid.match(/\d+/)[0]) + 1;
};

let resetNewConstraint = () => {
    newConstraint = {
        comment: '',
        id: '',
        is_active: false,
        name: '',
        local_name: '',
        pageid: '',
        parameters: {},
        title: '',
        weight: 0,
    };
}

let updateParamsListNewConstraint = () => {
    newConstraint.local_name = htmlElements.constraintEditType.value;
    newConstraint.name = findConstraintClassFromLocalName(newConstraint.local_name).name;
    newConstraint.id = getNewConstraintID(newConstraint.name);
    newConstraint.pageid = newConstraint.name + newConstraint.id;
    newConstraint.parameters = database.constraint_types[newConstraint.name].parameters;
    updateParamsListExistingConstraint(newConstraint);
};

let updateParamsListExistingConstraint = (constraint) => {
    // Clear previous parameters
    let div = htmlElements.constraintEditParams;
    while (div.firstChild) {
        div.removeChild(div.lastChild);
    }

    // Fill parameters
    constraint.parameters.sort((a, b) => (a.required && !b.required) ? -1 : (!a.required && b.required) ? 1 : b.id_list?.length - a.id_list?.length);
    constraint.parameters.forEach(param => {
        if (param.name === 'department') {
            return;
        }
        // Add empty id_list as selected elements (none when constraint has just been created)
        if (!param.id_list) {
            param.id_list = [];
        }

        let button = buttonWithDropBuilder(constraint, param);
        div.append(button);
    })
};

let fillEditConstraintPopup = constraint => {
    let type = htmlElements.constraintEditType;
    let title = htmlElements.constraintEditTitle;
    let comment = htmlElements.constraintEditComment;
    let params = htmlElements.constraintEditParams;
    let activation = htmlElements.constraintEditActivation;
    let weightSlider = htmlElements.constraintEditWeightSlider;
    let weightValue = htmlElements.constraintEditWeightValue;

    if (!constraint) {
        type.selectedIndex = 0;
        type.disabled = false;
        title.value = '';
        comment.value = '';
        activation.checked = true;
        weightSlider.value = 9;
        weightValue.innerText = gettext('Strong constraint');
        params.innerHTML = '';
    } else {
        let localName = findConstraintLocalNameFromClass(constraint.name);
        Array.from(type.options).some((option, index) => {
            if (option.text === localName) {
                type.selectedIndex = index;
                type.disabled = true;
                return true;
            }
            return false;
        });

        title.value = constraint.title ?? '';
        comment.value = constraint.comment ?? '';
        activation.checked = constraint.is_active;
        weightSlider.value = constraint.weight ?? 9;
        weightValue.innerText = constraint.weight ? gettext('Weight : ') + constraint.weight : gettext('Strong constraint');
        updateParamsListExistingConstraint(constraint);
    }
};

let onChangeAllWeeksFilter = () => {
    filter.by_week(htmlElements.filterAllWeeks.checked ? null : selected_week);
    filter.reapply();
};

// Replaces given constraint's values with entered from user
let extractConstraintFromPopup = (constraint) => {
    const alert = (message, type) => {
        const wrapper = document.createElement('div');

        wrapper.innerHTML = [
            `<div class="alert alert-${type} alert-dismissible" role="alert">`,
            `   <div>${message}</div>`,
            '   <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>',
            '</div>',
        ].join('');
        htmlElements.constraintEditAlert.append(wrapper);
    }

    if (htmlElements.constraintEditType.selectedIndex === 0) {
        alert('Type is required!', 'danger');
        return;
    }

    constraint.title = htmlElements.constraintEditTitle.value;

    constraint.comment = htmlElements.constraintEditComment.value;
    constraint.is_active = htmlElements.constraintEditActivation.checked;
    constraint.weight = parseInt(htmlElements.constraintEditWeightSlider.value) === 9 ? null : parseInt(htmlElements.constraintEditWeightSlider.value)

    let isValid = true;

    Object.values(constraint.parameters).forEach(param => {
            // Ignore immutable parameters
            if (param.name === 'department') {
                return;
            }

            // Clear the previously selected values (only keep the latest save)
            param.id_list = [];

            if (param.type.includes('Boolean')) {
                let tag = document.getElementById('param-check-' + param.name);
                param.id_list.push(tag.checked);
            } else {
                if (param.name.includes('tutors')) {
                    let tag = document.getElementById('param-select-' + param.name);
                    tag.querySelectorAll('li').forEach((value, key, parent) => {
                        param.id_list.push(value.getAttribute('data-param-id'));
                    });
                } else {
                    // Store the selected values
                    let tag = document.getElementById('collapse-parameter-' + param.name);
                    let select = tag.querySelector('select')
                    if (select !== null) {
                        let selected_value = select.options[select.selectedIndex].value
                        if (selected_value !== '') {
                            param.id_list.push(selected_value)
                        }
                    } else {
                        tag.querySelectorAll('input').forEach((value, key, parent) => {
                            if (value.type === 'text' && value.value !== '') {
                                param.id_list.push(value.value);
                            } else {
                                if (value.checked) {
                                    param.id_list.push(value.getAttribute('element-id'));
                                }
                            }
                        });
                    }
                }

                if (param.required && param.id_list.length === 0) {
                    isValid = false;
                    alert(`Parameter ${param.name} is required!`, 'danger');
                }
            }
        }
    );
    return isValid;
};

let updateEditConstraintWeightDisplay = (labelID, value) => {
    let weightText = gettext('Strong constraint');
    if (value <= 8) {
        weightText = gettext('Weight : ') + value.toString();
    }
    document.getElementById(labelID).innerText = weightText;
}

// event handler that discard constraint changes and restore
// data to the original state
let discardChanges = (e) => {
    constraints = copyFromOriginalConstraints();
    resetActionChanges();
    constraint_list = Object.keys(constraints);
    selected_constraints = [];
    lastSelectedConstraint = null;
    filter.reapply();
    alertMessage.clearAll();
}
document.getElementById('discard-changes').addEventListener('click', discardChanges);

// shortcut function
let applyChanges = (e) => {
    changeEvents.normalizeActionChanges();
    changeEvents.commitChanges();
}

// clear input fields for filters
let clearFilters = (e) => {
    htmlElements.filterSearch.value = '';
    htmlElements.filterTutor.querySelector('input').value = '';
    htmlElements.filterGroup.value = '-1';
    htmlElements.filterAllWeeks.checked = false;
    filter.current.search = '';
    filter.current.tutor = null;
    filter.current.group = null;
    filter.by_week(selected_week);
    filter.reapply();
}

let saveConstraintChanges = () => {
    let constraintToSave = null;
    let changeCallback = null;

    // Obtain the contraint and function to call according to current state
    switch (currentState) {
        case State.CreateNewConstraint:
            constraintToSave = newConstraint;
            changeCallback = changeEvents.addNewConstraint;
            break;
        case State.EditConstraint:
            constraintToSave = editConstraint;
            changeCallback = changeEvents.editConstraint;
            break;
        default:
            return;
    }

    // Try to extract the constraint
    let isValid = extractConstraintFromPopup(constraintToSave);

    if (!isValid) {
        console.log('Constraint is not valid, cancelling...');
        return;
    }

    // Apply the change
    changeCallback(constraintToSave);

    // Clear alerts
    htmlElements.constraintEditAlert.innerHTML = '';

    // Hide popup
    const modal = bootstrap.Modal.getInstance(htmlElements.constraintsEditPopup);
    modal.hide();

    // Reset fields
    fillEditConstraintPopup(null);

    // Reset selected constraints
    lastSelectedConstraint = null;
    selected_constraints = [];

    // Reset current state
    setState(State.Nothing);

    // Refresh
    filter.reapply();
};

htmlElements.confirmEditConstraintButton.addEventListener('click', saveConstraintChanges);

let cancelNewConstraint = () => {
    setState(State.Nothing);

    // Hide popup
    const modal = bootstrap.Modal.getInstance(htmlElements.constraintsEditPopup);
    modal.hide();
};
htmlElements.cancelEditConstraintButton.addEventListener('click', cancelNewConstraint);

htmlElements.commitChangesButton.addEventListener('click', applyChanges);
htmlElements.fetchConstraintsButton.addEventListener('click', fetchers.fetchConstraints);
htmlElements.clearFiltersButton.addEventListener('click', clearFilters);

let selected_constraints = [];
let lastSelectedConstraint = null;

// number of constraints selected updater
let updateNumberConstraints = () => {
    htmlElements.numberSelectedConstraints.innerText = selected_constraints.length.toString();
}

let broadcastConstraint = undefined;

// HTML element builder to help with the code
let elementBuilder = (tag, args = {}) => {
    let ele = document.createElement(tag);
    for (const [key, value] of Object.entries(args)) {
        ele.setAttribute(key, value);
    }
    return ele;
}

let selectBuilder = (param_name, args = {}, id_to_select) => {
    let ele = elementBuilder('select', args);
    let options = database.acceptable_values[param_name].acceptable
    let opt = document.createElement('option')
    opt.value = ''
    opt.innerHTML = ''
    ele.appendChild(opt)
    for (let i = 0; i < options.length; i++) {
        let opt = document.createElement('option')
        let option_id = options[i]
        opt.value = option_id
        opt.innerHTML = getCorrespondingInfo(option_id, param_name)
        ele.appendChild(opt)
    }
    let optionToSelect = Array.from(ele.options).find(item => item.value === id_to_select);
    optionToSelect.selected = true;
    return ele;
}

/**
 * Creates a custom select with an input and a list.
 **/
let createSelect = (id, placeholder, label, searchMethod, result_interpret, additional_onclick, {
        first_option_text = '',
        first_option_on_click = null,
        select_once: select_once = false
    }) => {
        let container = divBuilder({});
        let input = elementBuilder('input', {
            'id': `custom-list-input-${id}`,
            'type': 'text',
            'class': 'form-control mt-3',
            'placeholder': placeholder,
            'aria-label': label,
        });
        let list = divBuilder({
            'id': `custom-list-${id}`,
            'class': 'list-group w-auto custom-v-select-list',
            'style': 'display: none;',
            'tabindex': '0',
        });

        let create_option = (link) => {
            let option_id = `${id}-${link.replace(' ', '-')}`;
            return elementBuilder('a', {
                'id': option_id,
                'href': `#${option_id}`,
                'class': 'list-group-item list-group-item-action fs-6 lh-1',
                'tabindex': '-1',
            });
        };

        let show_list = () => {
            list.style.display = 'block';
            currentSelectList.reset(list, input);
        };

        let hide_list = () => {
            list.style.display = 'none';
            currentSelectList.reset();
        };

        let refresh_list = (search_value) => {
            list.innerHTML = '';

            if (first_option_text.length > 0) {
                let option = create_option(first_option_text);
                option.text = first_option_text;
                if (first_option_on_click) {
                    let element = {'id': null};
                    option.onclick = (e) => {
                        e?.stopPropagation();
                        additional_onclick(element, input, list);
                        if (select_once) {
                            refresh_list(input.value);
                        }
                    };
                }
                list.append(option);
            }

            let search_results = searchMethod(search_value);

            search_results.forEach(element => {
                let title = result_interpret(element);
                let option = create_option(title);
                option.text = title;
                option.onclick = (e) => {
                    e?.stopPropagation();
                    additional_onclick(element, input, list);
                    if (select_once) {
                        refresh_list(input.value);
                    }
                };
                list.append(option);
            });
            show_list();
        };

        let close_listener = (e) => {
            if (list.style.display !== 'none') {
                hide_list();
            }
        };

        list.addEventListener('list-close', close_listener);

        input.onclick = () => {
            if (list.style.display === 'none') {
                refresh_list(input.value);
            }
        };

        input.oninput = () => {
            refresh_list(input.value);
        };

        container.append(input, list);
        return container;
    }
;

let createSelectSingle = (label_text, searchMethod, result_interpret, option_on_click, first_option_text = '') => {
    let container = divBuilder();

    let on_click = (element, input, list) => {
        input.value = result_interpret(element);
        list.dispatchEvent(list_close);
        option_on_click(element, input, list);
    };

    container.append(createSelect(label_text, `${label_text}...`, label_text, searchMethod, result_interpret, on_click, {
        first_option_text: first_option_text,
        first_option_on_click: true
    }));
    return container;
};

let createSelectedElement = (element, selected_elements_html, selected_elements, element_title, element_name) => {
    let selected_element = elementBuilder('li', {
        'class': 'list-group-item fs-6',
        'style': 'text-align: center',
        'data-param-id': element.id,
    });
    let content = divBuilder({
        'data-bs-toggle': 'tooltip',
        'data-bs-title': element_title,
        'data-bs-placement': 'top',
    });
    const tooltip = bootstrap.Tooltip.getOrCreateInstance(content);
    tooltip.enable();

    content.innerHTML = element_name;
    let remove_badge = elementBuilder('span', {
        'class': 'badge bg-danger rounded-pill',
        'style': 'cursor: pointer',
    });
    remove_badge.innerHTML = 'X';
    remove_badge.onclick = () => {
        selected_elements_html.removeChild(selected_element);
        let index = selected_elements.findIndex(selected_element => selected_element.id === element.id);
        if (index === -1) {
            return;
        }
        selected_elements.splice(index, 1);
    }
    selected_element.append(content, remove_badge);
    return selected_element;
};

let createSelectMultiple = (label_text, searchMethod, result_interpret, result_simple_interpret, selected_elements_id = '', already_selected = [], select_once = false) => {
    let container = divBuilder();

    let selected_elements = elementBuilder('ul', {
        'id': selected_elements_id,
        'class': 'list-group list-group-horizontal custom-h-select-list border border-solid',
    });

    let on_click = (element, input, list) => {
        let selected_element = createSelectedElement(element, selected_elements, already_selected, result_interpret(element), result_simple_interpret(element));
        selected_elements.append(selected_element);
        already_selected.push(element);
    };

    already_selected.forEach(element => {
        selected_elements.append(createSelectedElement(element, selected_elements, already_selected, result_interpret(element), result_simple_interpret(element)));
    });

    let new_searchMethod = (search) => {
        let result = searchMethod(search)
        if (select_once) {
            let selected_ids = already_selected.map(selected => selected.id);
            result = result.filter(element => {
                return !selected_ids.includes(element.id);
            });
        }
        return result;
    }

    container.append(selected_elements, createSelect(selected_elements_id, `${label_text}...`, label_text, new_searchMethod, result_interpret, on_click, {select_once: select_once}));
    return container;
};

// returns the corresponding database table based on the parameter given
let getCorrespondingDatabase = (param) => {
    switch (param) {
        case 'group':
        case 'groups':
            return database['groups'];
        case 'module':
        case 'modules':
            return database['modules'];
        case 'course_type':
        case 'course_types':
            return database['course_types'];
        case 'room_type':
        case 'room_types':
            return database['room_types'];
        case 'train_prog':
        case 'train_progs':
            return database['train_progs'];
        case 'tutor':
        case 'tutors':
        case 'guide_tutors':
            return database['tutors_ids'];
        case 'rooms':
        case 'possible_rooms':
        case 'room':
            return database['rooms']
        case 'weeks':
            return database['weeks'];
        default:
            return database['acceptable_values'][param];
    }
}

// returns the information needed from a parameter and a constraint id given
let getCorrespondingInfo = (id, param) => {
    let db = getCorrespondingDatabase(param);
    switch (param) {
        case 'group':
        case 'groups':
            return `${db[id]['train_prog']}-${db[id]['name']}`;
        case 'module':
        case 'modules':
        case 'train_prog':
        case 'train_progs':
            return db[id]['abbrev'];
        case 'tutors':
        case 'guide_tutors':
        case 'tutor':
        case 'rooms':
        case 'possible_rooms':
        case 'room':
            return db[id]['name'];
        case 'course_type':
        case 'course_types':
        case 'room_type':
        case 'room_types':
            return db[id];
        case 'weeks':
            return `${db[id]['year']}-${db[id]['nb']}`;
        case 'start_time':
        case 'start_times':
        case 'possible_start_times':
        case 'allowed_start_times':
            return floptime_to_str_time(id);
        case 'fampm_period':
        case 'fhd_period':
        case 'weekday':
        case 'weekdays':
        case 'forbidden_week_days':
        case 'possible_week_days':
            return choices[id];
        default:
            return id;
    }
}

let isParameterValueSelectedInConstraint = (constraint, parameter, value) => {
    return constraint.parameters.find(param => param.name === parameter).id_list.includes(value);
};

let getContraintFilledParametersCount = (constraint) => {
    return constraint.parameters.filter(param => {
        return !param.required && param.id_list.length > 0;
    }).length;
};

// returns the parameter object from a constraint obejct
let getParamObj = (constraint, param) => {
    for (p of constraint.parameters) {
        if (p.type === param) {
            return p;
        }
    }
}

// event handler that deletes a constraint's parameter
let deleteConstraintParameter = (e) => {
    let div = document.getElementById('parameter-screen');
    let cst_id = div.attributes['data-cst-id'].value;
    let constraint = constraints[cst_id];
    let param = div.attributes['parameter'].value;
    changeEvents.deleteConstraintParameter(
        constraint.name,
        constraint.id,
        param,
        constraint.pageid,
    );
    document.getElementById('parameter-screen').parentElement.remove();
}

// remove the display on constraint parameters
let cancelConstraintParameter = (e) => {
    document.querySelectorAll('#parameter-screen').forEach(node => {
        node.remove();
    });
}

// returns elements that make part of the parameter screen
let createSelectedParameterPopup = (constraint, parameter) => {
    let param_obj = (constraint.parameters.filter(o => o.name === parameter))[0];
    let divs = divBuilder();

    let values = divBuilder();

    let createCheckboxAndLabel = (ele, inputType) => {
        let temp_id = 'acceptable' + ele.toString();
        let str = getCorrespondingInfo(ele, parameter);

        let checked = isParameterValueSelectedInConstraint(constraint, parameter, ele);

        let form = divBuilder({
            'class': 'form-check form-check-inline',
        });

        let input = elementBuilder('input', {
            'class': 'form-check-input me-1',
            'type': inputType,
            'id': temp_id,
            'element-id': ele,
            'name': 'elementsParameter',
        });
        input.checked = checked;
        let label = elementBuilder('label', {
            'class': 'form-check-label ms-1 me-3',
            'for': temp_id,
        });
        label.innerHTML = str;
        form.append(input, label);
        values.append(form);
    };

    // if param_obj is multiple or this condition should be satisfied!
    if (param_obj.multiple) {
        let acceptable_values = database.acceptable_values[parameter].acceptable;

        let create_and_fill_selected = () => {
            acceptable_values.forEach(ele => {
                createCheckboxAndLabel(ele, 'checkbox');
            });
        };

        let select_all = () => {
            divs.querySelectorAll('input').forEach(element => {
                element.checked = true;
            });
        };

        let remove_all = () => {
            divs.querySelectorAll('input').forEach(element => {
                element.checked = false;
            });
        };

        create_and_fill_selected();

        let select_all_button = elementBuilder('button', {
            'type': 'button',
            'class': 'btn btn-primary',
        });
        select_all_button.innerHTML = gettext('Select all');
        select_all_button.onclick = () => {
            select_all();
        };

        let remove_all_button = elementBuilder('button', {
            'type': 'button',
            'class': 'btn btn-danger',
        });
        remove_all_button.innerHTML = gettext('Remove all');
        remove_all_button.onclick = () => {
            remove_all();
        };

        let cancel_button = elementBuilder('button', {
            'type': 'button',
            'class': 'btn btn-secondary',
        });
        cancel_button.innerHTML = gettext('Cancel');
        cancel_button.onclick = () => {
            values.innerHTML = '';
            create_and_fill_selected();
        };

        let buttons = divBuilder({
            'class': 'mt-3 btn-group w-100',
            'role': 'group',
        });

        buttons.append(select_all_button, remove_all_button, cancel_button);
        divs.append(values, buttons);
    } else if (param_obj.type.includes('.') || database.acceptable_values[parameter].acceptable.length>0) {
        let temp_id = parameter + '-value';

        let form = divBuilder({
            'class': 'form-floating',
        })
        let select = selectBuilder(parameter, {
            'id': temp_id,
            'element-id': 0,
            'name': 'elementsParameter',
        }, param_obj.id_list[0] === undefined ? '' : param_obj.id_list[0]);

        form.append(select);
        divs.append(form);
    } else {
        let temp_id = parameter + '-value';

        let form = divBuilder({
            'class': 'form-floating',
        })

        let input = elementBuilder('input', {
            'class': 'form-control',
            'id': temp_id,
            'element-id': 0,
            'name': 'elementsParameter',
            'value': param_obj.id_list[0] === undefined ? '' : param_obj.id_list[0]
        });

        let label = elementBuilder('label', {
            'for': temp_id,
        });

        label.innerHTML = 'Valeur';

        form.append(input, label);
        divs.append(form);
    }

    /* Do not consider parameters buttons for now
    let divButtons = divBuilder({
        class: 'buttons-for-parameters',
    });

    let deleteButton = elementBuilder('button', {
        type: 'button',
        class: 'btn btn-danger',
    });
    deleteButton.innerHTML = gettext('Delete');
    deleteButton.addEventListener('click', deleteConstraintParameter);

    let cancelButton = elementBuilder('button', {
        type: 'button',
        class: 'btn btn-secondary',
    });
    cancelButton.innerHTML = gettext('Cancel');
    cancelButton.addEventListener('click', cancelConstraintParameter);

    divButtons.append(cancelButton, deleteButton);

    divs.append(divButtons);*/

    return divs;
}

// builds a button that shows a drop menu after clicking on it
let buttonWithDropBuilder = (constraint, parameter) => {
    let buttonID = 'parameter-' + parameter.name;
    let collapseID = 'collapse-' + buttonID;

    let badge = '';

    if (parameter.required) {
        badge = elementBuilder('span', {
            'class': 'badge text-bg-danger ms-1',
        });
        badge.innerText = gettext('Required');
    }

    let button;

    let buttonHeader = divBuilder({
        'class': 'accordion-header',
        'id': buttonID,
    });

    let collapse = divBuilder({
        'class': 'accordion-collapse collapse',
        'id': collapseID,
        'labelledby': buttonID,
        'data-bs-parent': '#' + htmlElements.constraintEditParams.id,
    });

    // Different display for boolean parameters
    if (parameter.type.includes('Boolean')) {
        button = divBuilder({
            'class': 'form-check form-switch m-3',
        });

        let checkID = `param-check-${parameter.name}`;

        let check = elementBuilder('input', {
            'class': 'form-check-input',
            'type': 'checkbox',
            'role': 'switch',
            'id': checkID,
        });

        if (isParameterValueSelectedInConstraint(constraint, parameter.name, 'true')) {
            check.checked = true;
        }

        let label = elementBuilder('label', {
            'class': 'form-check-label',
            'for': checkID,
        });
        label.innerText = parameter.name;
        button.append(check, label, badge);
    } else {
        let color = '';
        if (parameter.id_list.length > 0) {
            color = 'text-success';
        }
        button = elementBuilder('button', {
            'class': `accordion-button collapsed ${color}`,
            'type': 'button',
            'data-bs-toggle': 'collapse',
            'data-bs-target': '#' + collapseID,
            'aria-expanded': 'false',
            'aria-controls': collapseID,
        });
        console.log(parameter.name);
        button.innerText = gettext(parameter.name);
        console.log(gettext(parameter.name));
        button.append(badge);

        let elements;

        if (parameter.name.includes('tutors')) {
            let label_text = "";
            if (parameter.name === 'guide_tutors') {
                label_text = gettext('Guide tutor');}
            else{
                label_text = gettext('Tutor');
            }
            let acceptable_values = database.acceptable_values.tutor.acceptable;

            let element_obj = (tutor_id) => {
                let tutor = database.tutors[database.tutors_ids[tutor_id].name];
                return {'element': tutor, 'id': tutor_id};
            };

            let searchMethod = searchTutors;
            let result_interpret = element => {
                return `${element.element.username} - ${element.element.first_name} ${element.element.last_name}`;
            };
            let result_simple_interpret = element => {
                return element.element.username;
            };

            let param_obj = (constraint.parameters.filter(o => o.name === parameter.name))[0];

            let selected = param_obj.id_list.map(id => element_obj(id));

            let id = `param-select-${parameter.name}`;

            let select = createSelectMultiple(label_text, searchMethod, result_interpret, result_simple_interpret, id, selected, true);

            let select_all_button = elementBuilder('button', {
                'type': 'button',
                'class': 'btn btn-primary',
            });
            select_all_button.innerHTML = gettext('Select all');
            select_all_button.onclick = () => {
                let selected_list = document.getElementById(id);
                selected_list.innerHTML = '';
                acceptable_values.forEach(tutor_id => {
                    let element = element_obj(tutor_id);
                    selected_list.append(createSelectedElement(element, selected_list, selected, result_interpret(element), result_simple_interpret(element)));
                });
            };

            let remove_all_button = elementBuilder('button', {
                'type': 'button',
                'class': 'btn btn-danger',
            });
            remove_all_button.innerHTML = gettext('Remove all');
            remove_all_button.onclick = () => {
                let selected_list = document.getElementById(id);
                selected_list.innerHTML = '';
            };

            let cancel_button = elementBuilder('button', {
                'type': 'button',
                'class': 'btn btn-secondary',
            });
            cancel_button.innerHTML = gettext('Cancel');
            cancel_button.onclick = () => {
                let selected_list = document.getElementById(id);
                selected_list.innerHTML = '';
                selected.forEach(element => {
                    selected_list.append(createSelectedElement(element, selected_list, selected, result_interpret(element), result_simple_interpret(element)));
                });
            };

            elements = divBuilder();

            let buttons = divBuilder({
                'class': 'mt-3 btn-group w-100',
                'role': 'group',
            });

            buttons.append(select_all_button, remove_all_button, cancel_button);

            elements.append(select, buttons);
        } else {
            elements = createSelectedParameterPopup(constraint, parameter.name);
        }
        let body = divBuilder({
            'class': 'accordion-body',
        });

        body.append(elements);
        collapse.append(body);
    }

    let itemContainer = divBuilder({
        'class': 'accordion-item',
    })

    buttonHeader.append(button);
    itemContainer.append(buttonHeader, collapse);
    return itemContainer;
}

// rerender the constraints on the page (in case of a modification)
let refreshConstraints = () => {
    htmlElements.enabledConstraintsList.innerHTML = '';
    htmlElements.disabledConstraintsList.innerHTML = '';
    lastSelectedConstraint = null;

    buildConstraintsSections();
    refreshSelectedFromList(selected_constraints);
    visibility.hidePopover();
}

// main section builder
let buildSection = (name, list) => {
    let ret = divBuilder({'class': 'constraints-section-full mb-2'});
    let title = divBuilder({'class': 'constraints-section-title'});
    let cards = divBuilder({'class': 'constraints-section ', 'id': 'section-' + name});
    let map = list.map(id => constraintCardBuilder(constraints[id]));
    title.innerText = gettext(name);
    cards.append(...map)
    ret.append(title, cards);
    return ret;
}

// helps with the generation of the page's sections
let buildConstraintsSections = () => {
    htmlElements.enabledConstraintsList.innerHTML = '';

    if (filtered_constraint_list == null) {
        filter.reapply()
    }

    let dict = {};

    let group_mode = htmlElements.constraintsGroupMode.value;
    if (group_mode === 'class') {
        Object.values(constraints).forEach(cst => {
            if (filtered_constraint_list.includes(cst.pageid)) {
                let localName = findConstraintLocalNameFromClass(cst.name)
                if (!dict[localName]) {
                    dict[localName] = {
                        'active': [],
                        'inactive': [],
                    };
                }
                dict[localName][cst.is_active ? 'active' : 'inactive'].push(cst.pageid);
            }
        });
    } else if (group_mode === 'status') {
        dict[gettext('Strong constraints')] = {
            'active': [],
            'inactive': [],
        };
        dict[gettext('Preferences')] = {
            'active': [],
            'inactive': [],
        };
        Object.values(constraints).forEach(cst => {
            if (filtered_constraint_list.includes(cst.pageid)) {
                if (cst.weight === null) {
                    dict[gettext('Strong constraints')][cst.is_active ? 'active' : 'inactive'].push(cst.pageid);
                } else {
                    dict[gettext('Preferences')][cst.is_active ? 'active' : 'inactive'].push(cst.pageid);
                }
            }
        });


    }
    //(group_mode==='none')
    else {
        dict[gettext('All constraints')] = {
            'active': [],
            'inactive': [],
        };
        Object.values(constraints).forEach(cst => {
            if (filtered_constraint_list.includes(cst.pageid)) {
                dict[gettext('All constraints')][cst.is_active ? 'active' : 'inactive'].push(cst.pageid);
            }
        });
    }

    // build active constraints section
    let activeConstraintsElements = {};
    Object.keys(dict).forEach(key => {
        if (dict[key].active.length === 0) {
            return;
        }
        activeConstraintsElements[key] = buildSection(key, dict[key].active);
    });
    htmlElements.enabledConstraintsList.append(...Object.values(activeConstraintsElements));

    // build inactive constraints section
    let inactiveConstraintsElements = {};
    Object.keys(dict).forEach(key => {
        if (dict[key].inactive.length === 0) {
            return;
        }
        inactiveConstraintsElements[key] = buildSection(key, dict[key].inactive);
    });
    htmlElements.disabledConstraintsList.append(...Object.values(inactiveConstraintsElements));
}
htmlElements.constraintsGroupMode.addEventListener('change', refreshConstraints);

// event handler when clicking on a constraint
let constraintClicked = (e) => {
    if (e.target.type === 'checkbox') {
        return;
    }
    let id = e.currentTarget.getAttribute('data-cst-id');
    if (e.currentTarget.classList.contains('selected')) {
        e.currentTarget.classList.remove('selected');
        e.currentTarget.classList.add('unselected');
        let index = selected_constraints.indexOf(id);
        if (index > -1) {
            selected_constraints.splice(index, 1);
        }
        let indexNextConstraint = selected_constraints.length - 1;
        lastSelectedConstraint = (indexNextConstraint > -1) ? selected_constraints[indexNextConstraint] : null;
    } else {
        e.currentTarget.classList.remove('unselected');
        e.currentTarget.classList.add('selected');
        selected_constraints.push(id);

        lastSelectedConstraint = id;
    }
    refreshSelectedFromList(selected_constraints);
}

// color selected constraints
let refreshSelectedFromList = (list) => {
    let cardList = htmlElements.enabledConstraintsList;
    let allSelected = true;

    cardList.querySelectorAll('.constraint-card').forEach(constraintCard => {
        if (list.indexOf(constraintCard.getAttribute('data-cst-id')) < 0) {
            constraintCard.classList.remove('selected');
            constraintCard.classList.add('unselected');
            allSelected = false;
        } else {
            constraintCard.classList.remove('unselected');
            constraintCard.classList.add('selected');
        }
    });

    htmlElements.constraintsSelectAll.checked = allSelected;
    updateNumberConstraints();
}

// select all constraint simulator
let selectAll = (e) => {
    if (selected_constraints.length === Object.keys(constraints).length) {
        selected_constraints = [];
    } else {
        selected_constraints = Object.keys(constraints);
    }
    refreshSelectedFromList(selected_constraints);
}

htmlElements.constraintsSelectAll.checked = false;
htmlElements.constraintsSelectAll.onchange = selectAll;

// builds a div... helps with the code
let divBuilder = (args = {}) => {
    let div = document.createElement('div');
    for (let [key, value] of Object.entries(args)) {
        div.setAttribute(key, value);
    }
    return div;
}

// builds a div that contains an icon and text
let iconTextBuilder = (imgurl, value, attr) => {
    let div = divBuilder({'class': 'icon-text ' + attr});
    let icondiv = divBuilder({'class': 'icon-div'});
    let img = document.createElement('img');
    img.setAttribute('class', 'icon-info');
    img.src = imgurl;
    let strong = document.createElement('strong');
    strong.innerText = value;
    icondiv.append(img);
    div.append(icondiv, strong)

    return div;
}

// event handler that activates a constraint
let toggleConstraint = (e) => {
    // Get constraint's id as in the constraints object
    let pageid = e.getAttribute('data-cst-id');

    // Get its constraint object
    let ele = constraints[pageid];

    // Toggle its activation
    ele.is_active = !ele.is_active;

    actionChanges.edit[pageid] = ele;

    refreshConstraints();
}

// Open the popup. If baseConstraint is provided then its data will be used to fill the popup.
let openNewConstraintPopup = (baseConstraint) => {
    setState(State.CreateNewConstraint);
    const modal = new bootstrap.Modal(htmlElements.constraintsEditPopup, null);

    visibility.hidePopover();

    if (!baseConstraint) {
        resetNewConstraint();
    } else {
        newConstraint = baseConstraint;
    }
    fillEditConstraintPopup(baseConstraint);

    modal.show();
};
htmlElements.newConstraintButton.addEventListener('click', _ => openNewConstraintPopup(null));

let editSelectedConstraint = (pageid) => {
    if (!pageid) {
        return;
    }
    setState(State.EditConstraint);

    visibility.hidePopover();

    const modal = new bootstrap.Modal(htmlElements.constraintsEditPopup, null);

    editConstraint = copyObj(constraints[pageid]);
    fillEditConstraintPopup(editConstraint);

    modal.show();
};

let deleteSelectedConstraint = (pageid) => {
    if (!pageid) {
        return;
    }
    changeEvents.deleteConstraint(pageid);
};

let deleteSelectedConstraints = () => {
    selected_constraints.forEach(pageid => {
        changeEvents.deleteConstraint(pageid);
    });
};

// duplicate a constraint
let duplicateSelectedConstraint = (pageid) => {
    if (!pageid) {
        return;
    }
    let constraint = constraints[pageid];
    if (!constraint) {
        console.error('Constraint not found');
        return;
    }
    let newConstraint = copyObj(constraint);
    newConstraint.id = getNewConstraintID(newConstraint.name);
    newConstraint.pageid = newConstraint.name + newConstraint.id;
    openNewConstraintPopup(newConstraint);
}

// builds the card for the constraint
let constraintCardBuilder = (constraint) => {
    let localName = findConstraintLocalNameFromClass(constraint.name);

    let popover_id = `popover-${constraint.pageid}`;
    let editButton = `<button type="button" class="btn btn-primary" onclick="editSelectedConstraint('${constraint.pageid}')">${gettext('Edit')}</button>`;
    let deleteButton = `<button type="button" class="btn btn-danger" onclick="deleteSelectedConstraint('${constraint.pageid}')">${gettext('Delete')}</button>`;
    let duplicateButton = `<button type="button" class="btn btn-info" onclick="duplicateSelectedConstraint('${constraint.pageid}')">${gettext('Duplicate')}</button>`;
    let popover_content = '';
/*     constraint.parameters.forEach((param) => {
        if (param.name === 'department') {
            return
        }
        if (param.id_list.length > 0) {
            popover_content += param.name + ' : '
            param.id_list.forEach((id) =>
                popover_content += getCorrespondingInfo(id, param.name) + ', '
            )
            popover_content += '</br>'
        }
    }) */
    popover_content += `<div class="btn-group" role="group" aria-label="Constraint edit">${duplicateButton}${editButton}${deleteButton}</div>`;

    const wrapper = divBuilder({
        'class': 'card border border-3 border-primary me-1 mb-1 constraint-card h-25',
        'style': 'width: 18rem;',
        'data-cst-id': constraint.pageid,
        'draggable': true,
        'id': popover_id,
        'data-bs-title': `${(constraint.title || localName)}`,
        'data-bs-html': true,
        'data-bs-content': popover_content,
        'data-bs-container': '#constraints-body',
    });

    let checkText = constraint.is_active ? 'checked' : '';

    let weight = (constraint.weight && constraint.weight < 9) ? `<div class="col">${iconTextBuilder(htmlElements.iconWeight.src, constraint.weight, 'weight').outerHTML}</div>` : '';

    wrapper.innerHTML = [
        `<h6 class="card-header py-1">${constraint.title || localName}</h6>`,
        '<div class="card-body py-0">',
        `    <h7 class="card-subtitle mt-0 mb-1 text-muted">${constraint.comment ?? ''}</h7>`,
        `    <div class="container-fluid">`,
        '        <div class="row">',
        `        <div class="col">${iconTextBuilder(htmlElements.iconGears.src, getContraintFilledParametersCount(constraint), 'parameters').outerHTML}</div>`,
        `        ${weight}`,
        `        <div class="col-auto text-end">`,
        `            <input type="checkbox" id="cst-check-${constraint.pageid}" data-cst-id="${constraint.pageid}" ${checkText} onchange="toggleConstraint(this)">`,
        `            <label class="form-check-label" for="cst-check-${constraint.pageid}">${constraint.is_active ? gettext('Active') : gettext('Inactive')}</label>`,
        '        </div>',
        '</div>',
    ].join('');

    wrapper.addEventListener('click', constraintClicked, false);
    wrapper.addEventListener('dragstart', (ev) => {
        // Add the target element's id to the data transfer object
        ev.dataTransfer.setData('text/plain', ev.target.id);
    });
    wrapper.addEventListener('contextmenu', function (e) {
        const popover = bootstrap.Popover.getOrCreateInstance(`#${popover_id}`);
        if (popover) {
            visibility.showPopover(popover);
        }
        e.preventDefault();
    }, false);
    wrapper.addEventListener('dblclick', function (e) {
        editSelectedConstraint(constraint.pageid)
    });

    return wrapper;
}

// empty the page
let emptyPage = () => {
    let body = htmlElements.enabledConstraintsList;
    let bodyDisabled = htmlElements.disabledConstraintsList;
    body.innerHTML = '';
    bodyDisabled.innerHTML = '';
}

// constranit sorting based on argument
let sortConstraintsBy = (cst_list, arg) => {
    if (!constraints[cst_list[0]].hasOwnProperty(arg)) {
        return;
    }
    if (typeof constraints[cst_list[0]][arg] == 'object') {
        cst_list.sort((x, y) => {
            return constraints[x][arg].length < constraints[y][arg].length ? 1 : -1;
        });
    } else {
        cst_list.sort((x, y) => {
            return constraints[x][arg] < constraints[y][arg] ? 1 : -1;
        });
    }
    return cst_list;
}

// updates the weight for all constraints
let editSelectedConstraintsWeight = () => {
    let weight = htmlElements.selectedConstraintsEditWeightSlider.value;
    selected_constraints.forEach(id => {
        constraints[id].weight = weight;
    });
    refreshConstraints();
}

let searchTutors = tutorSearch => {
    tutorSearch = tutorSearch.toLowerCase();

    // Find all the tutors with matching search
    let tutors = Object.values(database.tutors);
    let tutors_match_search = tutors.filter(tutor =>
        tutor.first_name.toLowerCase().includes(tutorSearch)
        || tutor.last_name.toLowerCase().includes(tutorSearch)
        || tutor.username.toLowerCase().includes(tutorSearch));

    // Return the matching tutors' id
    return tutors_match_search.map(tutor => {
        let t = Object.values(database.tutors_ids).find(t => t.name === tutor.username);
        if (t) {
            return {'element': tutor, 'id': '' + t.id};
        }
    })
};

htmlElements.selectedConstraintsEditWeightButton.onclick = editSelectedConstraintsWeight;
htmlElements.selectedConstraintsDeleteButton.onclick = deleteSelectedConstraints;

htmlElements.filterTutor.append(createSelectSingle(gettext('Tutor'), searchTutors, element => {
    return element.id === null ? gettext('All tutors') : `${element.element.username} - ${element.element.first_name} ${element.element.last_name}`
}, (element, input, list) => {
    filter.by_tutor(element.id);
    filter.reapply();
}, gettext('All tutors')));

let constraint_list = null;
let filtered_constraint_list = [];
let constraint_metadata = null;

// fetch data from database
fetchers.fetchDepartments(null);
fetchers.fetchTrainingPrograms(null);
fetchers.fetchStructuralGroups(null);
fetchers.fetchTutors(null);
fetchers.fetchModules(null);
fetchers.fetchRooms(null);
fetchers.fetchCourseTypes(null);
fetchers.fetchRoomTypes(null);
fetchers.fetchTutorsIDs(null);
//fetchers.fetchCourses(null);
fetchers.fetchWeeks();
fetchers.fetchConstraintTypes();
fetchers.fetchConstraints(null);

let alertMessage = {
    _builder: (type, message) => {
        let container = divBuilder({
            'class': `alert alert-${type} alert-dismissible fade show`,
            'role': 'alert',
        });
        let message_container = elementBuilder('h6');
        message_container.innerText = message;
        let close_button = elementBuilder('button', {
            'type': 'button',
            'class': 'btn-close',
            'data-bs-dismiss': 'alert',
            'aria-label': 'Close',
        });
        container.append(message_container, close_button);
        return container;
    },
    info: (message) => {
        htmlElements.messagesBanner.append(alertMessage._builder('primary', message));
    },
    error: (message) => {
        htmlElements.messagesBanner.append(alertMessage._builder('danger', message));
    },
    success: (message) => {
        htmlElements.messagesBanner.append(alertMessage._builder('success', message));
    },
    clearAll: () => {
        htmlElements.messagesBanner.innerHTML = '';
    },
};

let check_list_event = (e) => {
    let node_contains = (node, content) => {
        return node === content || node.contains(content)
    };

    let list = currentSelectList.list;
    if (!list) {
        return;
    }
    let list_node = document.getElementById(list.id);
    if (!list_node) {
        return;
    }
    let input = currentSelectList.input;

    if (!input) {
        return;
    }
    let input_node = document.getElementById(input.id);
    if (!input_node) {
        return;
    }
    if (!(node_contains(list_node, e.target) || node_contains(input_node, e.target))) {
        list.dispatchEvent(list_close);
    }
};

document.addEventListener('click', (e) => {
    if (currentPopover && !currentPopover.tip.contains(e.target)) {
        visibility.hidePopover();
    }

    check_list_event(e);
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' && currentSelectList.list) {
        e.preventDefault();
        currentSelectList.previous_entry();
    }

    if (e.key === 'ArrowDown' && currentSelectList.list) {
        e.preventDefault();
        currentSelectList.next_entry();
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'Enter' && currentSelectList.list) {
        e.preventDefault();
        currentSelectList.press_entry();
    }

    if (e.key === 'Escape' && currentSelectList.list) {
        e.preventDefault();
        currentSelectList.close();
    }
});
