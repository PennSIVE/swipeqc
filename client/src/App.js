import { useState, useRef, useEffect } from 'react';
import Swing from 'react-swing';
import axios from 'axios';
import './App.css';
const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

function App() {
  const stackEl = useRef(null);
  const [user, setUser] = useState(null); // set user
  const [users, setUsers] = useState([]);
  const [newUserForm, setNewUserForm] = useState(false);
  const [cards, setCards] = useState([]);
  const [stack, setStack] = useState(null);

  // throwOut Method
  const throwCard = () => {
    // React Card Directions
    // console.log('React.DIRECTION', React.DIRECTION);

    console.log('stack', stack);
    console.log('stack.getConfig', stack.getConfig());
    console.log('stackEl', stackEl);

    // React Component Childrens
    const targetEl = stack.childElements[1];
    console.log('targetEl', targetEl);

    if (targetEl && targetEl.current) {
      // stack.getCard
      const card = stack.getCard(targetEl.current);

      console.log('card', card);

      // throwOut method call
      // card.throwOut(100, 200, React.DIRECTION.RIGHT);
    }
  };

  // load cards
  useEffect(() => {
    axios({
      url: apiUrl + '/images/list',
      method: 'GET',
    }).then(res => {
      const imageData = res.data;
      const cards = [];

      for (let i = 0; i < imageData.length; i++) {
        const data = imageData[i];
        cards.push(
          <div key={i} className="card" ref={`card${i}`}>
            <img src={apiUrl + "/images/get?path=" + encodeURIComponent(data.path)} alt={data.name} />
          </div>,
        );
      }

      setCards(cards)
    }).catch(err => console.error(err))
  }, []);

  // load users
  useEffect(() => {
    axios({
      url: apiUrl + '/users/list',
      method: 'GET',
    }).then(res => {
      const data = res.data;
      const users = [];
      for (let i = 0; i < data.length; i++) {
        users.push(
          <option id={data[i][0]}>{data[i][1]}</option>
        )
      }
      setUsers(users);
    }).catch(err => console.error(err))
  }, []);

  // re-instantiate react state from localStorage
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      setUser(user);
    }
  }, []);

  const createRating = (image, rating, user) => {
    const formData = new FormData();
    formData.append('uid', user);
    formData.append('passed', rating);
    formData.append('image', image.src);
    axios({
      url: apiUrl + '/ratings/create',
      method: 'POST',
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data"
      },
    }).then(res => {
      console.log(res);
    }).catch(err => console.error(err))
  }
  const deleteRating = (image) => {
    const formData = new FormData();
    formData.append('image', image.src);
    axios({
      url: apiUrl + '/ratings/delete',
      method: 'POST',
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data"
      },
    }).then(res => {
      console.log(res);
    }).catch(err => console.error(err))
  }

  if (user === null) {
    return (
      <div className="grid grid-cols-1 content-center h-full">
        <select className="px-4 py-3 rounded w-56 mx-auto form-select" onChange={(e) => {
          if (e.target.value === 'new') {
            setNewUserForm(true);
          } else {
            setUser(e.target[e.target.selectedIndex].id);
            localStorage.setItem('user', e.target[e.target.selectedIndex].id);
          }
        }}>
          <option value="" disabled selected>Select User</option>
          {users}
          <option value="new">New user</option>
        </select>
        {newUserForm && (
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            axios({
              url: apiUrl + '/users/create',
              method: 'POST',
              data: formData,
              headers: {
                "Content-Type": "multipart/form-data"
              },
            }).then(res => {
              setUser(res.data.id);
              localStorage.setItem('user', res.data.id);
            }).catch(err => console.error(err))

          }} className="mx-auto mt-2">
            <input type="text" placeholder="Name" name="name" className="form-input w-32 rounded mr-2" />
            <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Submit</button>
          </form>)}
      </div>
    )
  }
  return (
    <div className="App">
      <Swing
        className="stack"
        setStack={(stack) => setStack(stack)}
        ref={stackEl}
        throwoutleft={(e) => createRating(e.target.children[0], 0, user)}
        throwoutright={(e) => createRating(e.target.children[0], 1, user)}
        throwin={(e) => deleteRating(e.target.children[0])}
      >
        {cards}
      </Swing>
    </div>
  );
}

export default App;
