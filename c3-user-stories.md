Please edit this template and commit to the master branch for your user stories submission.   
Make sure to follow the *Role, Goal, Benefit* framework for the user stories and the *Given/When/Then* framework for the Definitions of Done! You can also refer to the examples DoDs in [C3 spec](https://sites.google.com/view/ubc-cpsc310-21w2-intro-to-se/project/checkpoint-3).

## User Story 1
As a user, I want to add datasets by uploading zip files from the local machine, and display the uploaded datasets in a HTML table with ID's, Kind's, so that I can know which dataset I can make queries to.


#### Definitions of Done(s)
Scenario 1: Upload a courses zip file with ID `courses` that has `100` valid courses.
Given: The website doesn't have a dataset with ID `courses`.
When: The User clicks on the `Upload a dataset` button
Then: 
  - A file selection window will pop up.
  - The user selects the zip file from local storage, and click `Open` button.
  - The file selection window closes.
  - A new prompt notifies the user that the dataset with ID `courses` has been uploaded. 
  - The dataset with ID `courses` will be saved as a copy in the server. 
  - The dataset will be added to the table with its ID `courses`, Kind `Course` and Rows `100` data.

Scenario 2:Upload a datasets with ID `courses` that already exsits in the table.
Given: The website has a dataset with ID `courses`.
When: The User clicks on the `Upload a dataset` button
Then:
  - A file selection window will pop up.
  - The user selects the zip file from local storage, and click `Open` button.
  - The file selection window closes.
  - An prompt notifies the user that the uploading failed because the dataset already exists.

Scenario 3: Upload a datasets with ID `rooms` with `no valid` rooms.\
Given: The website doesn't have a Room dataset with ID `rooms`.
When: The User clicks on the `Upload a dataset` button 
Then: 
  - A file selection window will pop up.
  - The user selects the zip file from local storage, and click `Open` button.
  - The file selection window closes.
  - An prompt notifies the user that the uploading failed because there is `no valid` Rooms in the dataset.

## User Story 2
As a student, I want to query courses in a particular department that have a minimum course average and order
by course average, so that I can know which courses to take to potentially boost my GPA.


#### Definitions of Done(s)
Scenario 1: The result of the query has too many courses.
Given: The website has a courses dataset.
When: The user enters a query which is too broad.
Then: There will be a prompt saying "Query has too many courses. Try narrowing your search."

Scenario 2: The result of the query is valid.
Given: The website has a courses dataset.
When: The user enters a valid query with a valid result.
Then: Courses will be displayed with required fields (given by COLUMNS in the query), and are scrollable.

Scenario 3: The query is invalid.
Given: The website has a courses dataset.
When: The user enters an invalid query.
Then: There will be a prompt saying "Your query is invalid. Please double check your input."

Scenario 4: The result of the query is empty.
Given: The website has a courses dataset.
When: The user enters a valid query with an empty result.
Then: There will be a prompt saying "There are no courses that meet your requirements. Try broadening your search."



## Others
You may provide any additional user stories + DoDs in this section for general TA feedback.  
Note: These will not be graded.
