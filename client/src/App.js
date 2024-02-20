import { useState, useRef, useEffect } from "react";
import { useBeforeunload } from "react-beforeunload";
import Swing from "react-swing";
import axios from "axios";
import "./App.css";
const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:43829/api";
var numCards = 0;

function App() {
  const stackEl = useRef(null);
  const [user, setUser] = useState(null); // set user
  const [users, setUsers] = useState([]);
  const [newUserForm, setNewUserForm] = useState(false);
  const [cards, setCards] = useState([]);

  // load cards
  const loadCards = () => {
    if (!user) {
      return;
    }
    axios({
      url: apiUrl + "/images/list",
      method: "GET",
      params: {
        user: user,
      },
    })
      .then((res) => {
        const imageData = res.data;
        const cards = [];

        for (let i = 0; i < imageData.length; i++) {
          const data = imageData[i];
          cards.push(
            <div key={i} className="card" ref={`card${i}`}>
              <video
                autoPlay={false}
                loop={true}
                muted={true}
                playsInline={true}
                className="w-full"
                onLoadedMetadata={(e) =>
                  (e.target.currentTime = e.target.duration / 2)
                }
                onWheel={(e) => {
                  // set video time to current time + deltaY
                  e.target.currentTime += (e.deltaY / 1000) * e.target.duration;
                }}
                data-id={data.id}
              >
                <source
                  src={
                    apiUrl +
                    "/images/get?format=webm&path=" +
                    encodeURIComponent(data.webm)
                  }
                  type="video/webm"
                />
                {/* <source src={apiUrl + "/images/get?format=mp4&path=" + encodeURIComponent(data.mp4)} data-id={data.id} type="video/mp4" /> */}
              </video>
            </div>
          );
        }

        setCards(cards);
        numCards = cards.length;
      })
      .catch((err) => console.error(err));
  };
  useEffect(loadCards, [user]);

  // load users
  useEffect(() => {
    axios({
      url: apiUrl + "/users/list",
      method: "GET",
    })
      .then((res) => {
        const data = res.data;
        const users = [];
        for (let i = 0; i < data.length; i++) {
          users.push(<option id={data[i][0]}>{data[i][1]}</option>);
        }
        setUsers(users);
      })
      .catch((err) => console.error(err));
  }, []);

  // re-instantiate react state from localStorage
  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      setUser(user);
    }
  }, []);

  // clear pending images before page unload
  useBeforeunload(() => {
    if (user) {
      axios({
        url: `${apiUrl}/users/${user}/clear-pending`,
        method: "GET",
      }).catch((err) => console.error(err));
    }
  });

  const createRating = (image, rating, user) => {
    numCards = numCards - 1;
    if (numCards === 0) {
      // loadCards();
      // hack: above not working, reload page
      window.location.reload();
    }
    const formData = new FormData();
    formData.append("uid", user);
    formData.append("passed", rating);
    formData.append("image", image.dataset.id);
    axios({
      url: apiUrl + "/ratings/create",
      method: "POST",
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
      .then((res) => {
        if (res.status !== 200) {
          console.error(res);
        }
      })
      .catch((err) => console.error(err));
  };
  const deleteRating = (image) => {
    numCards = numCards + 1;
    const formData = new FormData();
    formData.append("image", image.dataset.id);
    axios({
      url: apiUrl + "/ratings/delete",
      method: "POST",
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
      .then((res) => {
        if (res.status !== 200) {
          console.error(res);
        }
      })
      .catch((err) => console.error(err));
  };

  if (user === null) {
    return (
      <div className="grid grid-cols-1 content-center h-full">
        <select
          className="px-4 py-3 rounded w-56 mx-auto form-select"
          onChange={(e) => {
            if (e.target.value === "new") {
              setNewUserForm(true);
            } else {
              setUser(e.target[e.target.selectedIndex].id);
              localStorage.setItem("user", e.target[e.target.selectedIndex].id);
            }
          }}
        >
          <option value="" disabled selected>
            Select User
          </option>
          {users}
          <option value="new">New user</option>
        </select>
        {newUserForm && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              axios({
                url: apiUrl + "/users/create",
                method: "POST",
                data: formData,
                headers: {
                  "Content-Type": "multipart/form-data",
                },
              })
                .then((res) => {
                  setUser(res.data.id);
                  localStorage.setItem("user", res.data.id);
                })
                .catch((err) => console.error(err));
            }}
            className="mx-auto mt-2"
          >
            <input
              type="text"
              placeholder="Name"
              name="name"
              className="form-input w-32 rounded mr-2"
            />
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Submit
            </button>
          </form>
        )}
      </div>
    );
  }
  return (
    <div className="App">
      <Swing
        className="stack"
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
