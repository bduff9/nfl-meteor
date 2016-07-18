$(function() {
  $('body').on('input propertychange', '.floating-label-form-group', function(ev) {
    $(this).toggleClass('floating-label-form-group-with-value', !!$(ev.target).val());
  }).on('focus', '.floating-label-form-group', function() {
    $(this).addClass('floating-label-form-group-with-focus');
  }).on('blur', '.floating-label-form-group', function() {
    $(this).removeClass('floating-label-form-group-with-focus');
  });
});