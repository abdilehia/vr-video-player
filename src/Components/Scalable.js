/*
Same idea as draggable but, on top of maintaining the offset to the hand/grip, you scale
the object. The effect is that you are scaling from the area that you are grabbing. On top
of that, you can also clamp it to bounds to prevent scaling past a certain point. This
works for a max but not sure about a min?

The issue is that, things should either be draggable or scalable. However, what should the
heirarchy look like? If you have the scalable thing as the parent and the draggable thing
as the child, you would have to update the scalable parent's position and reset the child.
However, the opposite would cancel out the scalable and only do drag stuff.
*/
