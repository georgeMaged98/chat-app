const socket = io()

//Elements
const $messageForm = document.querySelector('#messageForm')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $locationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML
// Options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
})

const autoscroll = () => {
  //New Message Element
  const $newMessage = $messages.lastElementChild

  //Height of the new message
  const newMessageStyles = getComputedStyle($newMessage)
  const newMessageMargin = parseInt(newMessageStyles.marginBottom)
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

  //Visible Height
  const visibleHeight = $messages.offsetHeight

  //Height of the messages container
  const containerHeight = $messages.scrollHeight

  //How far have I scrolled ?
  const scrollOffset = $messages.scrollTop + visibleHeight

  console.log(visibleHeight, containerHeight, scrollOffset, $messages.scrollTop)
  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight
  }
}

socket.on('updateMessage', (message) => {
  //   console.log(message)
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format('h:mm a'),
  })
  $messages.insertAdjacentHTML('beforeend', html)
  autoscroll()
})

socket.on('updateLocation', (location) => {
  console.log(location)
  const html = Mustache.render(locationTemplate, {
    username: location.username,
    locationLink: location.url,
    createdAt: moment(location.createdAt).format('h:mm a'),
  })
  $messages.insertAdjacentHTML('beforeend', html)
})

socket.on('roomData', ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users,
  })

  document.querySelector('#sidebar').innerHTML = html
  autoscroll()
})

$messageForm.addEventListener('submit', (e) => {
  e.preventDefault()
  //disable the form
  $messageFormButton.setAttribute('disabled', 'disabled')

  const value = e.target.elements.message.value
  socket.emit('sendMessage', value, (error) => {
    //re-enable form
    $messageFormButton.removeAttribute('disabled')
    $messageFormInput.value = ''
    $messageFormInput.focus()
    if (error) {
      console.log(error)
    } else {
      console.log('Message is Delivered!')
    }
  })
})

$locationButton.addEventListener('click', () => {
  if (!navigator.geolocation) {
    return alert('Geolocation is not supported in your browser')
  }
  $locationButton.setAttribute('disabled', 'disabled')

  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit(
      'sendLocation',
      {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      },
      () => {
        $locationButton.removeAttribute('disabled')
        console.log('Location Shared')
      }
    )
  })
})

socket.emit('join', { username, room }, (error) => {
  if (error) {
    alert(error)
    location.href = '/'
  }
})
