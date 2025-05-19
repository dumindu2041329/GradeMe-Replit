// Personal Info reset button (around line 625)
<Button type="button" variant="outline" onClick={() => {
  // Clear form values completely 
  personalInfoForm.reset({
    name: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: undefined,
    class: '',
    guardianName: '',
    guardianPhone: '',
  });
}}>
  Reset
</Button>

// Notifications reset button (around line 805)
<Button type="button" variant="outline" onClick={() => {
  // Clear form values completely
  notificationForm.reset({
    emailNotifications: false,
    smsNotifications: false,
    emailExamResults: false,
    emailUpcomingExams: false,
    smsExamResults: false,
    smsUpcomingExams: false,
  });
}}>
  Reset
</Button>

// Security reset button (around line 951) - this one is already correct
<Button type="button" variant="outline" onClick={() => {
  passwordForm.reset({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
}}>
  Reset
</Button>
