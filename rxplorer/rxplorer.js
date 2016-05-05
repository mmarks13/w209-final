function select_tab(sel) {
    console.log("Function select_tab")
    $('.rx-tab').addClass('rx-hidden');
    $('.rx-tab-header').addClass('rx-tab-inactive');
    sel=$(sel);
    var hdr,tab;
    if(sel.attr('id').endsWith('-hdr')) {
	hdr=sel;
	tab=$('#'+sel.attr('id').slice(0,-4));
    } else {
	hdr=$('#'+sel.attr('id')+'-hdr');
	tab=sel;
    }
    tab.removeClass('rx-hidden');
    hdr.removeClass('rx-tab-inactive');
}

function activate_table_lens(physician) {    
    console.log('Creating table lens for', physician);
    var sel=$('#rx-table-lens');
    select_tab(sel);
    tableLens.init(sel[0], physician);
}

function activate_physician_selector() {
    console.log("Function activate_physician_selector")
    var sel=$('#rx-physician-filter');
    select_tab(sel);
}

$(document).ready(function(){
    console.log("Function $(document).ready")
    var filter_sel=$('#rx-physician-filter');
    select_tab(filter_sel);
    physician.init(filter_sel, $('#rx-physician-results'));
    physician.on_results_table_row_click(activate_table_lens);
    physician.marker_cb(function(ev) {
        console.log("this", this);
        console.log("args", arguments);
        activate_table_lens($(ev.target).data().psData);
    });
    $('.rx-tab-header').on('click', function(ev) {
        select_tab($(this));
	
    });
});
if(location.search=='?test-tl') {
    activate_table_lens({name: "Firstname", lastName: "Last-Name", physId: 348327, spec: "Allopathic & Osteopathic Physicians…"});
}
