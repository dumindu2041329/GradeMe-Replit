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
