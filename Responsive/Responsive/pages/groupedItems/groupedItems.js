﻿(function () {
    "use strict";

    var nav = WinJS.Navigation;
    var ui = WinJS.UI;

    var _groups = {
        earlier: '3',
        weekAgo: '2',
        thisWeek: '1'
    }

    ui.Pages.define("/pages/groupedItems/groupedItems.html", {
        // This function is called to initialize the page.
        init: function (element, options) {
            var today = new Date();
            this.todayFormatted = today.getDate() + '-' + (today.getMonth() + 1) + '-' + today.getFullYear();
            var local = localStorage.getItem('articles');
            if (local) {
                local = JSON.parse(local);
                if (local.date === this.todayFormatted) {
                    this.pastries = new WinJS.Promise(function (complete) {
                        complete({ response: local.articles });
                    });
                    return;
                }
            }
            this.pastries = WinJS.xhr({
                type: 'GET',
                url: 'https://the-pastry-box-project.net/api/v1/consume/thoughts?day='+this.todayFormatted+'&previous=21',
                responseType: 'json'
            });
        },

        // This function is called whenever a user navigates to this page.
        ready: function (element, options) {
            this.listView = document.querySelector('.groupeditemslist').winControl;
            this.listView.addEventListener('iteminvoked', this._itemInvoked.bind(this));

            this.pastries.done(function (resp) {
                this.stopProgress();
                if (resp && resp.response && resp.response.length) {
                    
                    localStorage.setItem('articles', JSON.stringify({date: this.todayFormatted, articles: resp.response}));
                    this.prepareList(resp.response);

                } else {
                    //none found
                }
            }.bind(this));

            element.querySelector('.toggle-list-view').addEventListener('click', function (e) {
                nav.navigate('/pages/groupedItemsCustom/groupedItems.html', {});
            }, false);
        },
        prepareList: function(response) {
            var articles = JSON.parse(response);
            var now = Date.now() / 1000;
            var aWeekAgo = now - 604800;
            var earlier = now - 1209600;
            for (var i = 0, length = articles.length; i < length; ++i) {
                var current = articles[i];
                if (current.pubdate < earlier) {
                    current.group = _groups.earlier;
                } else if (current.pubdate < aWeekAgo) {
                    current.group = _groups.weekAgo;
                } else {
                    current.group = _groups.thisWeek;
                }
                if (!current.title) {
                    current.title = current.nicedate;
                }
                if (current.photo) {
                    current.photoUrl = 'url(' + current.photo + ')';
                }
            }
            var articleList = new WinJS.Binding.List(articles);
            this.listView.itemDataSource = articleList.dataSource;
            this.listView.groupDataSource = articleList.createGrouped(this.getGroupKey, this.getGroupData).groups.dataSource;
        },
        unload: function() {

        },

        updateLayout: function (element) {
            /// <param name="element" domElement="true" />
            document.querySelector('.groupeditemslist').winControl.recalculateItemPosition();
            // TODO: Respond to changes in layout.
        },

        _itemInvoked: function (args) {
            var item = Data.items.getAt(args.detail.itemIndex);
            nav.navigate("/pages/itemDetail/itemDetail.html", { item: Data.getItemReference(item) });
        },
        stopProgress: function () {

        },
        compareGroups: function (a, b) {
            return a - b;
        },
        getGroupKey: function (data) {
            return data.group;
        },
        getGroupData: function (data) {
            var title;

            if (data.group === _groups.thisWeek) {
                title = 'This Week';
            } else if (data.group === _groups.weekAgo) {
                title = 'Last Week';
            } else {
                title = 'Earlier';
            }
            return {
                title: title
            };
        }
    });
})();
