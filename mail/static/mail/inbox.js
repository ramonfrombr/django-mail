document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);


  document.querySelector('#compose-form').addEventListener("submit", (e) => {
    e.preventDefault();

    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
          recipients: document.querySelector('#compose-recipients').value,
          subject: document.querySelector('#compose-subject').value,
          body: document.querySelector('#compose-body').value
      })
    })
    .then(response => response.json())
    .then(result => {
        console.log(result)
        load_mailbox('sent')
    })
  })

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function compose_email_reply(email) {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = email.sender;

  email.subject.startsWith("Re: ")
  ? document.querySelector('#compose-subject').value = email.subject
  : document.querySelector('#compose-subject').value = "Re: " + email.subject

  const body = `On ${email.timestamp} ${email.sender} wrote: ${email.body}`;
  
  document.querySelector('#compose-body').value = body;
}

function load_mailbox(mailbox) {
  
  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {

      if (emails.length > 0) {
        emails.map(email => {
          document.querySelector('#emails-view').append(create_mailbox_item(email, mailbox))
        })
      } else {
        const noMailMessage = document.createElement('p');
        noMailMessage.innerText = "There are no mails in \"" + mailbox + "\" category."
        document.querySelector('#emails-view').append(noMailMessage)
      }
      
      // ... do something else with emails ...
  });

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
}

function mark_read(email_id) {
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
        read: true
    })
  })
}

function toggle_archive(email) {
  fetch(`/emails/${email.id}`, {
    method: 'PUT',
    body: JSON.stringify({
        archived: !email.archived
    })
  }).then(response => load_mailbox('inbox'))
}

function create_mailbox_item(email, mailbox) {
  const emailItem = document.createElement('div');
  emailItem.classList.add('mailbox-item')

  email.read
  ? emailItem.classList.add('mailbox-read')
  : emailItem.classList.add('mailbox-unread');
  
  const emailSender = document.createElement('div');
  emailSender.classList.add("font-weight-bold", "mr-2");
  const emailSubject = document.createElement('div');
  const emailTimestamp = document.createElement('div');
  emailTimestamp.classList.add("text-secondary");

  emailSender.innerText = email.sender;
  emailSubject.innerText = email.subject;
  emailTimestamp.innerText = email.timestamp

  const emailRight = document.createElement('div');
  emailRight.classList.add('d-flex');

  emailRight.append(emailSender)
  emailRight.append(emailSubject)

  emailItem.append(emailRight)

  emailItem.append(emailTimestamp)
  
  emailItem.addEventListener('click', () => {
    
    if (!email.read) {
      mark_read(email.id);
    }

    load_mail(email, mailbox=='sent');
  })

  return emailItem;
}

function create_mail_item(email, is_sent) {
  const emailItem = document.createElement('div');
  emailItem.classList.add('mail')

  if (!is_sent) {
    const emailArchiveButton = document.createElement('button');
    emailArchiveButton.classList.add("archive-button")

    email.archived
    ? emailArchiveButton.innerText = "Unarchive"
    : emailArchiveButton.innerText = "Archive";

    emailArchiveButton.addEventListener('click', () => {
      toggle_archive(email);
    })


    const emailReplyButton = document.createElement('button');
    emailReplyButton.classList.add("reply-button")
    
    emailReplyButton.innerText = 'Reply';
    emailReplyButton.addEventListener('click', () => {
      compose_email_reply(email);
    })

    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('button-container');
    buttonContainer.append(emailReplyButton)
    buttonContainer.append(emailArchiveButton)
    
    emailItem.append(buttonContainer);
  }

  const emailSender = document.createElement('span');
  const emailRecipients = document.createElement('span');
  const emailSubject = document.createElement('span');
  const emailTimestamp = document.createElement('span');
  
  emailSender.innerHTML = "<b>by:</b> " + email.sender;
  emailRecipients.innerHTML = "<b>to:</b> " + email.recipients.join(', ');
  emailSubject.innerHTML = "<b>subject:</b> " + email.subject;
  emailTimestamp.innerHTML = "<b>date:</b> " + email.timestamp;
  

  const emailDetails = document.createElement('div');
  emailDetails.classList.add('mail-details');
  !is_sent && emailDetails.classList.add('move-top');
  emailDetails.append(emailSender);
  emailDetails.append(emailRecipients);
  emailDetails.append(emailTimestamp);
  emailDetails.append(emailSubject);

  const emailBody = document.createElement('div');
  emailBody.classList.add('mail-body');
  emailBody.innerText = email.body;
  
  emailItem.append(emailDetails)
  emailItem.append(emailBody);

  return emailItem;
}

function load_mail(email, is_sent) {

  document.querySelector('#email-view').innerText = "";
  document.querySelector('#email-view').append(create_mail_item(email, is_sent));

  // Show the mail and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block';
}